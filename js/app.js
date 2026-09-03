const state = {
  productos: [],
  filtroTexto: "",
  filtroCategoria: "",
  filtroMarca: "",
};

const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

async function cargarProductos() {
  const res = await fetch("data/products.json");
  state.productos = await res.json();
  poblarFiltros();
  render();
}

function poblarFiltros() {
  const categorias = [...new Set(state.productos.map((p) => p.categoria).filter(Boolean))].sort();
  const marcas = [...new Set(state.productos.map((p) => p.marca).filter(Boolean))].sort();

  const selCategoria = document.getElementById("filtro-categoria");
  const selMarca = document.getElementById("filtro-marca");

  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selCategoria.appendChild(opt);
  });

  marcas.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    selMarca.appendChild(opt);
  });
}

function productosFiltrados() {
  const texto = state.filtroTexto.trim().toLowerCase();
  return state.productos.filter((p) => {
    const coincideTexto =
      !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto) ||
      p.marca.toLowerCase().includes(texto);
    const coincideCategoria = !state.filtroCategoria || p.categoria === state.filtroCategoria;
    const coincideMarca = !state.filtroMarca || p.marca === state.filtroMarca;
    return coincideTexto && coincideCategoria && coincideMarca;
  });
}

function render() {
  const grid = document.getElementById("grid");
  const lista = productosFiltrados();

  document.getElementById("results-count").textContent =
    `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;

  if (lista.length === 0) {
    grid.innerHTML = "";
    document.getElementById("empty-state").hidden = false;
    return;
  }
  document.getElementById("empty-state").hidden = true;

  grid.innerHTML = lista
    .map(
      (p) => `
    <article class="card" data-codigo="${p.codigo}">
      <img src="${p.imagen}" alt="${p.nombre}" loading="lazy" />
      <div class="card-body">
        <span class="tag">${p.categoria || "Sin categoría"}</span>
        <h3>${p.nombre}</h3>
        <div class="marca">${p.marca || "—"} · ${p.codigo}</div>
        <div class="precios">
          ${p.precio_empresa_cliente != null ? `<span class="precio-empresa">PV ${money(p.precio_empresa_cliente)}</span>` : ""}
          ${p.precio_sugerido_publico != null ? `<span class="precio-publico">PSP ${money(p.precio_sugerido_publico)}</span>` : ""}
        </div>
      </div>
    </article>
  `
    )
    .join("");

  grid.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => abrirFicha(card.dataset.codigo));
  });
}

function abrirFicha(codigo) {
  const p = state.productos.find((x) => x.codigo === codigo);
  if (!p) return;

  const precioEmpresaHtml = p.precio_empresa_cliente != null
    ? `<div class="item"><div class="label">Precio empresa → cliente</div><div class="value">${money(p.precio_empresa_cliente)}</div></div>`
    : "";
  const precioPublicoHtml = p.precio_sugerido_publico != null
    ? `<div class="item"><div class="label">Sugerido al público</div><div class="value">${money(p.precio_sugerido_publico)}</div></div>`
    : "";

  const porqueHtml = p.por_que_recomendarlo
    ? `<div class="section-title">¿Por qué recomendarlo?</div><p>${p.por_que_recomendarlo}</p>`
    : "";
  const ingredientesHtml = p.ingredientes
    ? `<div class="section-title">Ingredientes</div><p>${p.ingredientes}</p>`
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

  document.getElementById("filtro-categoria").addEventListener("change", (e) => {
    state.filtroCategoria = e.target.value;
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
});
