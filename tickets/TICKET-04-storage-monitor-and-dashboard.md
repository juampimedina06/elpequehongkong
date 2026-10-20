# TICKET-04: Monitor de Consumo del Servidor (Free Tier) y Dashboard Admin

## 1. Contexto y Objetivo
Construir el Dashboard principal en `/admin` que exhiba en tiempo real el consumo de recursos del plan gratuito de Supabase (invocando la RPC `get_system_storage_stats()`) y los indicadores clave (KPIs) del inventario de productos y variantes.

**Mejora de Rendimiento y Resiliencia:**
- Ejecución en paralelo (`Promise.all`) de la RPC de almacenamiento y las métricas de inventario para minimizar el TTFB del Dashboard.
- Si la RPC `get_system_storage_stats()` aún no está instalada o devuelve formato parcial, el servicio calcula un fallback automático consultando los conteos de tablas/imágenes sin romper la página.

## 2. Archivos a Crear / Modificar
- `services/dashboard.service.ts`
- `components/admin/StorageMonitorCard.tsx`
- `components/admin/InventoryKpis.tsx`
- `components/admin/LowStockAlertsTable.tsx`
- `app/admin/page.tsx`

## 3. Requisitos Técnicos Exactos
1. **Monitor de Consumo Free Tier (`StorageMonitorCard`)**:
   - Consume `get_system_storage_stats()`.
   - Barras de progreso con semáforo cromático:
     - Verde (`< 70%`): `bg-emerald-500`
     - Amarillo (`70% - 90%`): `bg-amber-500`
     - Rojo (`> 90%`): `bg-red-600`
   - Métricas monitorizadas:
     1. **Base de Datos PostgreSQL**: Bytes usados sobre `500 MB` (`524,288,000` bytes).
     2. **Storage (`catalog-media`)**: Bytes usados sobre `1 GB` (`1,073,741,824` bytes) + contador total de fotos subidas.
     3. **Límites Informativos Plan Free**: Indicador de `5 GB` de ancho de banda (Egress) y `50.000` MAU.
2. **KPIs de Inventario y Alertas**:
   - **Total de productos activos** (`status = 'active'`).
   - **Valorización total del stock**: Suma de `stock_quantity * COALESCE(price_override, product.base_price)` de todas las variantes activas.
   - **Alertas de Stock Bajo**: Tabla directa con variantes donde `stock_quantity <= min_stock_alert`, con acceso rápido a ajustar stock o editar producto.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` validando cálculo de porcentajes de Free Tier, colores de semáforo, valorización de stock y detección de stock bajo.
- `npm run build` exitoso.
