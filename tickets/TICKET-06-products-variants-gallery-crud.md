# TICKET-06: CRUD de Productos, Variantes y Galería Drag & Drop

## 1. Contexto y Objetivo
Construir el gestor central del catálogo en `/admin/productos`, permitiendo administrar productos, sus variantes dinámicas (talle, color, medidas, SKU, `price_override`, stock inicial y alerta mínima), galería de imágenes `.webp` ordenables, edición rápida inline de precio/destacado y herramienta de actualización masiva de precios por porcentaje.

**Mejora de Rendimiento y Consistencia:**
- Transacciones lógicas con limpieza de archivos huérfanos si falla el guardado.
- Actualización masiva de precios en lote con redondeo opcional y actualización opcional de `compare_at_price`.
- Creación rápida de categoría inline dentro del modal de producto sin perder el estado del formulario.

## 2. Archivos a Crear / Modificar
- `services/products.repository.ts`
- `services/products.service.ts`
- `actions/products/products.actions.ts`
- `components/admin/ProductsTable.tsx`
- `components/admin/BulkPriceUpdateModal.tsx`
- `components/admin/ProductFormModal.tsx`
- `components/admin/QuickCategoryModal.tsx`
- `app/admin/productos/page.tsx`

## 3. Requisitos Técnicos Exactos
1. **Tabla Avanzada de Productos (`ProductsTable`)**:
   - Búsqueda por nombre/SKU, filtro por categoría y por estado (`draft`, `active`, `archived`).
   - Toggle rápido de **"Destacado en Inicio"** (`is_featured`).
   - Edición rápida (inline) de `base_price` con guardado directo.
   - Selección múltiple con checkboxes para abrir la **Actualización Masiva de Precios** (aumentar o disminuir por `%`).
2. **Formulario de Creación / Edición de Producto (`ProductFormModal`)**:
   - Datos generales: `name`, `slug` autogenerado, `description`, `base_price`, `compare_at_price` (precio tachado de oferta), `status`.
   - Selector de categoría con botón `+ Crear categoría rápida` integrado sin cerrar ni perder los datos del producto.
   - Gestor de variantes dinámicas: agregar/editar/eliminar filas con `name`, `size`, `color`, `dimensions`, `sku`, `price_override`, `stock_quantity` y `min_stock_alert`.
   - Gestor de galería de fotos: subida múltiple comprimida a `.webp`, reordenamiento (`display_order`, drag & drop / controles de orden), selección de imagen principal y asociación opcional de foto a variante, eliminando físicamente de `catalog-media` cualquier foto descartada.
3. **Invalidación de Caché**:
   - Ejecutar `revalidatePath` para `/`, `/catalogo`, `/producto/[slug]` y `/admin/productos` en cada mutación.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` verificando CRUD de productos, cálculo de actualización masiva de precios por porcentaje y limpieza de galería en Storage.
- `npm run build` exitoso.
