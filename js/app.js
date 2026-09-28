const state = {
  productos: [],
  filtroTexto: "",
  filtroMarca: "",
};

const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

async function cargarProductos() {
  try {
    const res = await fetch("data/products.json");
    state.productos = await res.json();
    poblarFiltros();
    render();
  } catch (e) {
    document.getElementById("results-count").textContent =
      "Sin conexión y sin datos guardados en este dispositivo. Abre el catálogo una vez con internet para poder usarlo luego sin conexión.";
  }
}

function poblarFiltros() {
  const marcas = [...new Set(state.productos.map((p) => p.marca).filter(Boolean))].sort();

  const selMarca = document.getElementById("filtro-marca");

  marcas.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    selMarca.appendChild(opt);
  });
}

const MARCAS_DESTACADAS = ["Bénet", "Haka", "Naturela"];

function productosFiltrados() {
  const texto = state.filtroTexto.trim().toLowerCase();
  return state.productos.filter((p) => {
    const coincideTexto =
      !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto) ||
      p.marca.toLowerCase().includes(texto);
    const coincideMarca = !state.filtroMarca || p.marca === state.filtroMarca;
    return coincideTexto && coincideMarca;
  });
}

function porCategorias(productos) {
  const porNombre = (a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es");
  const mapa = new Map();
  productos.forEach((p) => {
    const cat = p.categoria || "Sin categoría";
    if (!mapa.has(cat)) mapa.set(cat, []);
    mapa.get(cat).push(p);
  });
  return [...mapa.keys()]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((cat) => ({ titulo: cat, productos: mapa.get(cat).sort(porNombre) }));
}

function agruparProductos(lista) {
  const grupos = [];

  MARCAS_DESTACADAS.forEach((marca) => {
    const productos = lista.filter((p) => (p.marca || "").toLowerCase() === marca.toLowerCase());
    if (productos.length) {
      grupos.push({ titulo: marca, destacado: true, subcategorias: porCategorias(productos) });
    }
  });

  const restoMarcas = new Set(MARCAS_DESTACADAS.map((m) => m.toLowerCase()));
  const resto = lista.filter((p) => !restoMarcas.has((p.marca || "").toLowerCase()));

  porCategorias(resto).forEach((g) => {
    grupos.push({ titulo: g.titulo, destacado: false, productos: g.productos });
  });

  return grupos;
}

function tarjetaHtml(p) {
  return `
    <article class="card" data-codigo="${p.codigo}">
      <div class="card-image">
        <img src="${p.imagen_miniatura || p.imagen}" alt="${p.nombre}" loading="lazy" decoding="async" />
        ${p.nota ? `<span class="nota-badge">${p.nota}</span>` : ""}
      </div>
      <div class="card-body">
        <span class="tag">${p.categoria || "Sin categoría"}</span>
        <h3>${p.nombre}</h3>
        <div class="marca">${p.marca || "—"} · ${p.codigo}</div>
      </div>
      <div class="precios">
        ${p.precio_empresa_cliente != null
          ? `<div class="precio-empresa"><span class="precio-label">PV</span><span class="precio-valor">${money(p.precio_empresa_cliente)}</span></div>`
          : "<div></div>"}
        ${p.precio_sugerido_publico != null
          ? `<div class="precio-publico"><span class="precio-label">PSP</span><span class="precio-valor">${money(p.precio_sugerido_publico)}</span></div>`
          : "<div></div>"}
      </div>
    </article>
  `;
}

function render() {
  const container = document.getElementById("grid-container");
  const lista = productosFiltrados();

  document.getElementById("results-count").textContent =
    `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;

  if (lista.length === 0) {
    container.innerHTML = "";
    document.getElementById("empty-state").hidden = false;
    return;
  }
  document.getElementById("empty-state").hidden = true;

  const grupos = agruparProductos(lista);

  container.innerHTML = grupos
    .map((g) => {
      if (g.destacado) {
        const total = g.subcategorias.reduce((sum, sc) => sum + sc.productos.length, 0);
        const subHtml = g.subcategorias
          .map(
            (sc) => `
          <div class="subbloque">
            <h3 class="subbloque-titulo">${sc.titulo} <span class="bloque-count">${sc.productos.length}</span></h3>
            <div class="grid">${sc.productos.map(tarjetaHtml).join("")}</div>
          </div>
        `
          )
          .join("");
        return `
    <section class="bloque bloque-destacado">
      <h2 class="bloque-titulo">${g.titulo} <span class="bloque-count">${total}</span></h2>
      ${subHtml}
    </section>
  `;
      }
      return `
    <section class="bloque">
      <h2 class="bloque-titulo">${g.titulo} <span class="bloque-count">${g.productos.length}</span></h2>
      <div class="grid">${g.productos.map(tarjetaHtml).join("")}</div>
    </section>
  `;
    })
    .join("");

  container.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => abrirFicha(card.dataset.codigo));
  });
}

function abrirFicha(codigo) {
  const p = state.productos.find((x) => x.codigo === codigo);
  if (!p) return;

  const precioEmpresaHtml = p.precio_empresa_cliente != null
    ? `<div class="item"><div class="label">PV · Precio empresa → cliente</div><div class="value">${money(p.precio_empresa_cliente)}</div></div>`
    : "";
  const precioPublicoHtml = p.precio_sugerido_publico != null
    ? `<div class="item"><div class="label">PSP · Sugerido al público</div><div class="value">${money(p.precio_sugerido_publico)}</div></div>`
    : "";

  const porqueHtml = p.por_que_recomendarlo
    ? `<div class="callout"><div class="section-title">⭐ ¿Por qué recomendarlo?</div><p>${p.por_que_recomendarlo}</p></div>`
    : "";
  const ingredientesHtml = p.ingredientes
    ? `<div class="info-box"><div class="section-title">🌱 Ingredientes</div><p>${p.ingredientes}</p></div>`
    : "";

  const nutricionImgHtml = p.imagen_tabla_nutricional
    ? `<img src="${p.imagen_tabla_nutricional}" alt="Tabla nutricional de ${p.nombre}" class="img-nutricional" />`
    : "";

  document.getElementById("modal-body").innerHTML = `
    <div class="modal-images">
      <img src="${p.imagen}" alt="${p.nombre}" />
      ${nutricionImgHtml}
    </div>
    <div>
      <span class="tag">${p.categoria || "Sin categoría"}</span>
      ${p.nota ? `<span class="nota-badge">${p.nota}</span>` : ""}
      <h2>${p.nombre}</h2>
      <div class="marca">${p.marca || "Marca sin identificar"} · Código ${p.codigo}</div>

      <div class="precio-box">
        ${precioEmpresaHtml}
        ${precioPublicoHtml}
      </div>

      ${porqueHtml}
      ${ingredientesHtml}
    </div>
  `;

  document.getElementById("modal-overlay").hidden = false;
}

function cerrarFicha() {
  document.getElementById("modal-overlay").hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();

  document.getElementById("buscador").addEventListener("input", (e) => {
    state.filtroTexto = e.target.value;
    render();
  });

  document.getElementById("filtro-marca").addEventListener("change", (e) => {
    state.filtroMarca = e.target.value;
    render();
  });

  document.getElementById("modal-close").addEventListener("click", cerrarFicha);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") cerrarFicha();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarFicha();
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* si falla el registro, el sitio sigue funcionando normal con internet */
    });
  });
}
