# TICKET-09: Catálogo Público con Filtros por URL y Ficha de Producto (SEO)

## 1. Contexto y Objetivo
Construir la experiencia pública completa de exploración del catálogo (`/catalogo`) y la ficha de detalle de producto (`/producto/[slug]`) sin carrito ni pasarela de pagos, enfocada en velocidad de filtrado, claridad visual de variantes/stock, consulta directa opcional por WhatsApp y SEO/OpenGraph dinámico para compartir en redes.

**Mejora de Rendimiento y Búsqueda:**
- Filtros 100% sincronizados con `searchParams` en la URL usando `useTransition` y debounce (`300ms`) para evitar bloqueos de UI y permitir compartir URLs filtradas.
- Cálculo determinístico de **Badges automáticos** (`Nuevo`, `% OFF`, `Últimas unidades`, `Sin Stock`) reutilizable y testeado unitariamente.

## 2. Archivos a Crear / Modificar
- `utils/product-badges.ts`
- `components/public/CatalogFilters.tsx`
- `components/public/ProductCard.tsx`
- `components/public/ProductGallery.tsx`
- `components/public/ProductVariantSelector.tsx`
- `app/catalogo/page.tsx`
- `app/producto/[slug]/page.tsx`
- `tests/catalog-and-badges.test.ts`

## 3. Requisitos Técnicos Exactos
1. **Catálogo Público (`/catalogo`)**:
   - Sincronización con `searchParams`:
     - `q`: búsqueda de texto con debounce (aprovechando índice trigram en PostgreSQL `ilike` / texto).
     - `categoria` y `subcategoria`: slugs de categoría padre e hija.
     - `minPrice` y `maxPrice`: rango de precio.
     - `orden`: `recientes` (`created_at DESC`), `precio_asc` (`base_price ASC`), `precio_desc` (`base_price DESC`).
     - `enStock`: switch `"true"` para mostrar únicamente productos con stock disponible (`stock_quantity > 0`).
   - **Badges Automáticos en Cards**:
     - `"Nuevo"`: creado hace menos de 7 días.
     - `"% OFF"`: cuando `compare_at_price > base_price`, mostrando el porcentaje de descuento exacto.
     - `"Últimas unidades"`: cuando el stock total disponible es `> 0` y `<= min_stock_alert`.
     - `"Sin Stock"`: cuando el stock total de sus variantes es `0`.
2. **Ficha de Producto (`/producto/[slug]`)**:
   - **Galería con Zoom**: Visor principal con lupa/zoom interactivo al pasar el cursor o tocar, miniaturas y cambio automático de foto cuando se selecciona una variante que tiene `image_id` o imagen vinculada.
   - **Selector Interactivo de Variantes**: Selección de talle/color/medida que informa disponibilidad en tiempo real (`Disponible`, `Últimas X unidades`, `Agotado`) y actualiza el precio mostrado si la variante posee `price_override`.
   - **Consulta Directa por WhatsApp**: Botón opcional "Consultar por este producto" que abre `wa.me` con un mensaje pre-armado indicando el nombre del producto, SKU/variante seleccionada y link de la ficha (sin carrito ni armador de pedidos).
   - **SEO Dinámico (`generateMetadata`)**: Título, descripción, canonical y metadatos `openGraph` / `twitter` con la imagen principal del producto optimizada para previsualización en WhatsApp e Instagram.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` validando lógica de badges automáticos, filtros de catálogo y resolución de precios por variante.
- `npm run build` exitoso con todas las rutas públicas y privadas compiladas.
