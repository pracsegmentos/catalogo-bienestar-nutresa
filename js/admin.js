const OWNER = "pracsegmentos";
const REPO = "catalogo-bienestar-nutresa";
const BRANCH = "main";
const DATA_PATH = "data/products.json";
const API = "https://api.github.com";

let token = localStorage.getItem("gh_token") || "";
let products = [];
let productsSha = null;
let currentCodigo = null;

function ghHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ghGetFile(path) {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: ghHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo leer ${path} (${res.status})`);
  return res.json();
}

async function ghPutFile(path, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error guardando ${path} (${res.status})`);
  }
  return res.json();
}

async function loadProducts() {
  const file = await ghGetFile(DATA_PATH);
  productsSha = file.sha;
  products = JSON.parse(base64ToUtf8(file.content));
  renderList();
}

async function saveProducts(message) {
  const content = utf8ToBase64(JSON.stringify(products, null, 2));
  const result = await ghPutFile(DATA_PATH, content, message, productsSha);
  productsSha = result.content.sha;
}

function renderList(filter = "") {
  const list = document.getElementById("admin-list");
  const f = filter.trim().toLowerCase();
  const filtered = products.filter(
    (p) => !f || p.nombre.toLowerCase().includes(f) || p.codigo.toLowerCase().includes(f)
  );
  list.innerHTML = filtered
    .map(
      (p) => `
      <div class="item ${p.codigo === currentCodigo ? "active" : ""}" data-codigo="${p.codigo}">
        <div>${p.nombre || "(sin nombre)"}</div>
        <div class="codigo">${p.codigo}</div>
      </div>`
    )
    .join("");
  list.querySelectorAll(".item").forEach((el) => {
    el.addEventListener("click", () => openProduct(el.dataset.codigo));
  });
}

function openProduct(codigo) {
  const p = products.find((x) => x.codigo === codigo);
  if (!p) return;
  currentCodigo = codigo;
  document.getElementById("form-title").textContent = `Editar: ${p.nombre}`;
  const form = document.getElementById("product-form");
  form.codigo.value = p.codigo;
  form.codigo.disabled = true;
  form.nombre.value = p.nombre || "";
  form.categoria.value = p.categoria || "";
  form.marca.value = p.marca || "";
  form.precio_empresa_cliente.value = p.precio_empresa_cliente ?? "";
  form.precio_sugerido_publico.value = p.precio_sugerido_publico ?? "";
  form.ingredientes.value = p.ingredientes || "";
  form.por_que_recomendarlo.value = p.por_que_recomendarlo || "";
  document.getElementById("preview-imagen").src = p.imagen || "images/placeholder.svg";
  document.getElementById("preview-imagen-nutricional").src =
    p.imagen_tabla_nutricional || "images/placeholder-nutricion.svg";
  document.getElementById("file-imagen").value = "";
  document.getElementById("file-imagen-nutricional").value = "";
  document.getElementById("btn-eliminar").hidden = false;
  document.getElementById("form-status").textContent = "";
  document.getElementById("admin-form-box").hidden = false;
  renderList(document.getElementById("admin-buscador").value);
}

function openNewProduct() {
  currentCodigo = null;
  document.getElementById("form-title").textContent = "Nuevo producto";
  const form = document.getElementById("product-form");
  form.reset();
  form.codigo.disabled = false;
  document.getElementById("preview-imagen").src = "images/placeholder.svg";
  document.getElementById("preview-imagen-nutricional").src = "images/placeholder-nutricion.svg";
  document.getElementById("btn-eliminar").hidden = true;
  document.getElementById("form-status").textContent = "";
  document.getElementById("admin-form-box").hidden = false;
  renderList(document.getElementById("admin-buscador").value);
}

async function uploadImageIfNeeded(fileInputId, codigo, suffix) {
  const input = document.getElementById(fileInputId);
  const file = input.files[0];
  if (!file) return null;
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `images/productos/${codigo}${suffix}.${ext}`;
  const buffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const existing = await ghGetFile(path);
  await ghPutFile(path, base64, `Actualizar foto de ${codigo}`, existing ? existing.sha : null);
  return path;
}

async function handleSave(e) {
  e.preventDefault();
  const status = document.getElementById("form-status");
  const btn = document.getElementById("btn-guardar");
  const form = document.getElementById("product-form");
  const codigo = form.codigo.value.trim();

  if (!codigo || !form.nombre.value.trim()) {
    status.textContent = "Código y nombre son obligatorios.";
    return;
  }
  if (currentCodigo === null && products.some((p) => p.codigo === codigo)) {
    status.textContent = "Ya existe un producto con ese código.";
    return;
  }

  btn.disabled = true;
  status.textContent = "Guardando...";
  try {
    const nuevaImagen = await uploadImageIfNeeded("file-imagen", codigo, "");
    const nuevaImagenNutricional = await uploadImageIfNeeded("file-imagen-nutricional", codigo, "-nutricional");

    const existing = currentCodigo ? products.find((p) => p.codigo === currentCodigo) : null;

    const updated = {
      codigo,
      nombre: form.nombre.value.trim(),
      categoria: form.categoria.value.trim(),
      marca: form.marca.value.trim(),
      imagen: nuevaImagen || existing?.imagen || "images/placeholder.svg",
      imagen_tabla_nutricional:
        nuevaImagenNutricional || existing?.imagen_tabla_nutricional || "images/placeholder-nutricion.svg",
      ingredientes: form.ingredientes.value.trim(),
      por_que_recomendarlo: form.por_que_recomendarlo.value.trim(),
      precio_empresa_cliente: form.precio_empresa_cliente.value === "" ? null : Number(form.precio_empresa_cliente.value),
      precio_sugerido_publico: form.precio_sugerido_publico.value === "" ? null : Number(form.precio_sugerido_publico.value),
    };

    if (currentCodigo) {
      const idx = products.findIndex((p) => p.codigo === currentCodigo);
      products[idx] = updated;
    } else {
      products.push(updated);
    }

    await saveProducts(`${currentCodigo ? "Actualizar" : "Agregar"} producto ${codigo}`);
    currentCodigo = codigo;
    status.textContent = "Guardado. El sitio se actualiza en 1-2 minutos.";
    renderList(document.getElementById("admin-buscador").value);
  } catch (err) {
    status.textContent = "Error: " + err.message;
  } finally {
    btn.disabled = false;
  }
}

async function handleDelete() {
  if (!currentCodigo) return;
  if (!confirm(`¿Eliminar el producto ${currentCodigo}? Esta acción no se puede deshacer.`)) return;
  const status = document.getElementById("form-status");
  status.textContent = "Eliminando...";
  try {
    products = products.filter((p) => p.codigo !== currentCodigo);
    await saveProducts(`Eliminar producto ${currentCodigo}`);
    document.getElementById("admin-form-box").hidden = true;
    currentCodigo = null;
    renderList(document.getElementById("admin-buscador").value);
  } catch (err) {
    status.textContent = "Error: " + err.message;
  }
}

function wirePreview(fileInputId, previewId) {
  document.getElementById(fileInputId).addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById(previewId).src = URL.createObjectURL(file);
  });
}

async function init() {
  if (token) {
    document.getElementById("login-box").hidden = true;
    document.getElementById("app-box").hidden = false;
    try {
      await loadProducts();
    } catch (err) {
      alert("No se pudo conectar con GitHub: " + err.message + "\nRevisa que el token sea válido.");
      localStorage.removeItem("gh_token");
      token = "";
      document.getElementById("login-box").hidden = false;
      document.getElementById("app-box").hidden = true;
    }
  }

  document.getElementById("btn-save-token").addEventListener("click", async () => {
    const val = document.getElementById("token-input").value.trim();
    if (!val) return;
    token = val;
    localStorage.setItem("gh_token", token);
    document.getElementById("login-box").hidden = true;
    document.getElementById("app-box").hidden = false;
    try {
      await loadProducts();
    } catch (err) {
      alert("No se pudo conectar: " + err.message);
      localStorage.removeItem("gh_token");
      token = "";
      document.getElementById("login-box").hidden = false;
      document.getElementById("app-box").hidden = true;
    }
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("gh_token");
    location.reload();
  });

  document.getElementById("btn-nuevo").addEventListener("click", openNewProduct);
  document.getElementById("btn-cancelar").addEventListener("click", () => {
    document.getElementById("admin-form-box").hidden = true;
    currentCodigo = null;
    renderList(document.getElementById("admin-buscador").value);
  });
  document.getElementById("btn-eliminar").addEventListener("click", handleDelete);
  document.getElementById("product-form").addEventListener("submit", handleSave);
  document.getElementById("admin-buscador").addEventListener("input", (e) => renderList(e.target.value));

  wirePreview("file-imagen", "preview-imagen");
  wirePreview("file-imagen-nutricional", "preview-imagen-nutricional");
}

init();
