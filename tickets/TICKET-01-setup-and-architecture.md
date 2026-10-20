# TICKET-01: Clonación de Estructura Base y Configuración de Supabase

## 1. Contexto y Objetivo
Inicializar la arquitectura base inspirada en `fotos-tomi` (Next.js 16 App Router, TypeScript estricto, Tailwind CSS v4, Radix UI / CVA, Lucide Icons, `react-hot-toast`) y configurar la capa completa de conexión y tipado hacia Supabase (`@supabase/ssr` y `@supabase/supabase-js`).

Además, incorporar optimizaciones de rendimiento:
- Clientes tipados con `Database` (`types/database.types.ts` y `src/types/database.types.ts` re-exportado para compatibilidad total).
- Configuración de `next.config.ts` con `remotePatterns` para Supabase Storage y caché de imágenes optimizado.
- Separación clara de carpetas en raíz (`app/`, `actions/`, `components/`, `services/`, `lib/`, `hooks/`, `types/`, `utils/`, `tests/`).

## 2. Archivos a Crear / Modificar
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `components.json`, `.gitignore`, `.env.example`
- `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- `lib/utils.ts`
- `lib/supabase/client.ts` (Browser client con singleton/caching en cliente)
- `lib/supabase/server.ts` (Server Component / Server Action client con manejo seguro de cookies)
- `lib/supabase/admin.ts` (Service Role client sin persistencia de sesión para operaciones privilegiadas)
- `lib/supabase/proxy.ts` (Helper de sesión para Middleware/Proxy)
- `types/database.types.ts` y `src/types/database.types.ts`
- `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/skeleton.tsx`
- `utils/formatters.ts` (Formateadores de moneda ARS/USD, slugs, WhatsApp y fechas)

## 3. Requisitos Técnicos Exactos
1. **Tipado Completo de Base de Datos (`database.types.ts`)**:
   - Tablas:
     - `categories`: `id`, `name`, `slug`, `description`, `parent_id`, `image_url`, `storage_path`, `is_active`, `display_order`, `created_at`, `updated_at`.
     - `products`: `id`, `category_id`, `name`, `slug`, `description`, `base_price`, `compare_at_price`, `status` (`'draft' | 'active' | 'archived'`), `is_featured`, `created_at`, `updated_at`.
     - `product_variants`: `id`, `product_id`, `sku`, `name`, `size`, `color`, `dimensions`, `price_override`, `stock_quantity`, `min_stock_alert`, `image_id`, `is_active`, `created_at`, `updated_at`.
     - `product_images`: `id`, `product_id`, `variant_id`, `url`, `storage_path`, `alt_text`, `display_order`, `is_primary`, `created_at`.
     - `stock_movements`: `id`, `variant_id`, `movement_type` (`'IN' | 'OUT' | 'ADJUSTMENT'`), `quantity_change`, `previous_stock`, `new_stock`, `reason`, `created_by`, `created_at`.
     - `home_banners`: `id`, `title`, `subtitle`, `image_url`, `storage_path`, `link_url`, `cta_text`, `display_order`, `is_active`, `created_at`, `updated_at`.
   - Vistas:
     - `categories_with_count`: todos los campos de `categories` + `products_count: number` + `parent_name: string | null`.
   - Funciones RPC:
     - `register_stock_movement(p_variant_id, p_type, p_quantity_change, p_reason)`
     - `get_random_showcase_products(p_limit)`
     - `get_system_storage_stats()`
2. **Clientes Supabase**:
   - Soporte de variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (con fallback a `NEXT_PUBLIC_SUPABASE_ANON_KEY` para evitar errores de configuración).

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` pasa sin errores.
- `npm test` ejecuta tests de inicialización y formateadores pasando al 100%.
- `npm run build` compila el proyecto correctamente.
