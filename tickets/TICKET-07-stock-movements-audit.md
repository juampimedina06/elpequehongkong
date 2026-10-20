# TICKET-07: Módulo de Auditoría y Movimientos de Stock

## 1. Contexto y Objetivo
Gestionar en `/admin/stock` todas las entradas (`IN`), salidas/bajas (`OUT`) y ajustes (`ADJUSTMENT`) de mercadería de forma auditable invocando la función RPC `register_stock_movement`, manteniendo trazabilidad completa de quién, cuándo, por qué y cómo cambió el inventario.

**Mejora de Rendimiento y Usabilidad:**
- Buscador instantáneo de producto/variante con vista previa del stock actual y cálculo en vivo del stock resultante antes de confirmar el movimiento.
- Filtros por tipo de movimiento (`IN`, `OUT`, `ADJUSTMENT`) en el historial auditable.

## 2. Archivos a Crear / Modificar
- `services/stock.repository.ts`
- `services/stock.service.ts`
- `actions/stock/stock.actions.ts`
- `components/admin/StockMovementForm.tsx`
- `components/admin/StockHistoryTable.tsx`
- `app/admin/stock/page.tsx`

## 3. Requisitos Técnicos Exactos
1. **Registro de Movimiento (`StockMovementForm`)**:
   - Selector buscable de variante activa (mostrando Producto, Variante, SKU y `stock_quantity` actual).
   - Selector de tipo de operación:
     - `IN` (Ingreso de mercadería / compra / reposición)
     - `OUT` (Salida / baja / venta en mostrador / rotura)
     - `ADJUSTMENT` (Ajuste de inventario por conteo físico)
   - Input de cantidad y motivo obligatorio (`reason`).
   - Invoca `supabase.rpc('register_stock_movement', { p_variant_id, p_type, p_quantity_change, p_reason })`.
   - Revalida `/admin/stock`, `/admin`, `/admin/productos`, `/catalogo` y `/`.
2. **Historial de Movimientos (`StockHistoryTable`)**:
   - Lista `stock_movements` ordenado por `created_at DESC` con join a `product_variants` y `products`.
   - Muestra fecha/hora formateada (`es-AR`), producto/variante, badge de tipo (`IN`, `OUT`, `ADJUSTMENT`), `previous_stock`, `quantity_change`, `new_stock` y `reason`.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` validando invocación de la RPC `register_stock_movement` y validación de stock no negativo.
- `npm run build` exitoso.
