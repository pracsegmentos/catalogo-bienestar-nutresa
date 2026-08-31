# Catálogo Bienestar

Catálogo digital para el canal "bienestar", pensado para que los vendedores lo usen desde el celular o laptop con los clientes (reemplazo del PPT/PDF actual).

## Cómo funciona

Es un sitio web simple (sin backend). Toda la información de los productos vive en un solo archivo:

```
data/products.json
```

Las imágenes van en la carpeta `images/`.

Para actualizar el catálogo **no hay que tocar código**: solo se edita `data/products.json` directamente en GitHub (botón de lápiz ✏️ en la página del archivo) y se guarda el cambio ("commit"). El sitio se actualiza solo.

## Cómo corregir un producto existente (precio, marca, imagen, etc.)

1. En GitHub, abre `data/products.json`.
2. Busca el producto por su `codigo` (Ctrl+F / Cmd+F).
3. Edita el valor que necesites y guarda el cambio (commit). El sitio se actualiza solo.

El archivo `PENDIENTES_REVISION.csv` (en la raíz del proyecto) trae la lista de productos que el proceso automático de carga inicial dejó incompletos (sin precio, sin marca, sin ingredientes, etc.), para que sea fácil ir tachándolos.

## Cómo cambiar o agregar una foto

Cada producto tiene **dos fotos independientes**:

- `imagen`: la foto del producto.
- `imagen_tabla_nutricional`: una foto de la tabla nutricional / información nutricional (normalmente una captura del empaque), ya que ese dato no viene como texto sino como imagen.

Para cambiar cualquiera de las dos:

1. Sube el archivo de imagen a la carpeta `images/productos/` (arrastrándolo en la interfaz de GitHub). Nómbralo de forma clara, por ejemplo `1048822.jpg` o `1048822-nutricional.jpg`.
2. En `data/products.json`, en el producto correspondiente, cambia el valor de `imagen` o `imagen_tabla_nutricional` para que apunte a `images/productos/NOMBRE-QUE-SUBISTE.jpg`.

Si un producto todavía no tiene foto de tabla nutricional, el campo apunta a `images/placeholder-nutricion.svg` (un aviso de "imagen no disponible") — se reemplaza solo con subir la foto real y actualizar la ruta.

## Cómo agregar un producto nuevo

Copia este bloque, pégalo dentro de las llaves `[ ]` del archivo `products.json` (separado por una coma del producto anterior) y reemplaza los valores:

```json
{
  "codigo": "BN-000",
  "nombre": "Nombre del producto",
  "categoria": "Categoría del producto",
  "marca": "Marca",
  "imagen": "images/productos/NOMBRE-ARCHIVO.jpg",
  "imagen_tabla_nutricional": "images/productos/NOMBRE-ARCHIVO-nutricional.jpg",
  "ingredientes": "Lista de ingredientes separados por coma.",
  "por_que_recomendarlo": "Texto corto explicando el beneficio principal.",
  "precio_empresa_cliente": 3200,
  "precio_sugerido_publico": 4500
}
```

Notas:
- `codigo` debe ser único por producto.
- Los precios van sin puntos ni comas, solo el número (ej: `3200`, no `3.200`).
- Si todavía no tienes alguna de las fotos, deja `"images/placeholder.svg"` (foto de producto) o `"images/placeholder-nutricion.svg"` (tabla nutricional) como valor temporal.

## Estructura del proyecto

```
index.html              → estructura de la página
css/style.css           → estilos y colores de marca
js/app.js               → lógica de búsqueda, filtros y ficha de producto
data/products.json      → toda la información de los productos (lo único que se edita normalmente)
images/productos/       → fotos de producto y de tabla nutricional
images/placeholder.svg              → aviso de "sin foto de producto"
images/placeholder-nutricion.svg    → aviso de "sin foto de tabla nutricional"
PENDIENTES_REVISION.csv → lista de productos con datos incompletos, para ir corrigiendo
```

## Pendiente

- Revisar los 88 productos listados en `PENDIENTES_REVISION.csv` (precios, marca, ingredientes o fotos faltantes).
- Agregar las fotos de tabla nutricional (hoy todas apuntan al placeholder).
- Corregir los 3 códigos duplicados que trae el PDF original (2018288, 2030794, 2042648 — cada uno quedó como código y código-2).
- Ajustar colores exactos con el logo/manual de marca oficial de Nutresa si difieren del verde usado.
- Publicar en GitHub Pages.
