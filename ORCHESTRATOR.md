# ORCHESTRATOR — Plataforma de Catálogo Digital Dinámico & Gestión de Stock (`elpequehongkong`)

## Visión General de Arquitectura (Basada en `fotos-tomi` + Optimizaciones de Rendimiento)

Este proyecto replica la filosofía arquitectónica, estética minimalista editorial (`#fafafa`, `zinc-900`, anti-nesting, sin íconos decorativos superfluos) y separación en capas (`lib/supabase`, `services/*.repository.ts`, `services/*.service.ts`, `actions/`, `components/{admin,public,ui,auth}`, `hooks/`, `utils/`, `types/`) de `fotos-tomi`, adaptada a un catálogo de alta velocidad con gestión de inventario sobre **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase**.

### Mejoras Clave de Rendimiento, Caché y Recursos Incorporadas:
1. **Validación de Sesión en Middleware sin N+1 de Red**: Uso directo de `supabase.auth.getUser()` en el cliente de middleware (`proxy.ts` / `middleware.ts`) en lugar de re-instanciar clientes o consultar tablas innecesarias en cada request.
2. **Estrategia Híbrida de Caché en Next.js (`unstable_cache` / `revalidatePath` / `revalidateTag`)**:
   - Datos públicos de lectura frecuente (categorías activas, banners activos, recién llegados) cacheados e invalidados quirúrgicamente desde Server Actions cuando el Admin ejecuta mutaciones.
   - Showcase dinámico (`get_random_showcase_products`) con rotación controlada y fallback seguro.
3. **Protección Estricta del Free Tier de Supabase (1 GB Storage / 500 MB DB / 5 GB Egress)**:
   - Compresión WebP recursiva en cliente (`maxWidth: 1200`, calidad adaptativa `0.80 -> 0.65` para garantizar `< 150 KB` por imagen) antes de tocar la red.
   - `cacheControl: '31536000'` (1 año inmutable con nombres únicos con hash/timestamp) al subir objetos a `catalog-media` para reducir drásticamente el consumo de Egress y aprovechar el CDN de Supabase + `next/image`.
   - Rollback transaccional de archivos huérfanos si falla un insert/update en DB y barrido automático de archivos antiguos en Storage al reemplazar o eliminar categorías, productos o banners.
4. **Consultas SQL e Índices Optimizados**:
   - Selección explícita de columnas (evitando `SELECT *` innecesarios en listados masivos), paginación/límites controlados y búsqueda con debounce en URL (`searchParams`) apoyada en índices Trigram (`pg_trgm`) de PostgreSQL.

---

## Estado de Tickets

| ID | Ticket | Archivo | Estado | Verificación |
| :--- | :--- | :--- | :---: | :--- |
| **TICKET-01** | Clonación de Estructura Base y Configuración de Supabase | [`tickets/TICKET-01-setup-and-architecture.md`](./tickets/TICKET-01-setup-and-architecture.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-02** | Autenticación de Admin Único y Protección de Rutas (`/admin`) | [`tickets/TICKET-02-admin-auth-and-routing.md`](./tickets/TICKET-02-admin-auth-and-routing.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-03** | Utilidad de Compresión de Imágenes WebP y Limpieza de Storage | [`tickets/TICKET-03-webp-compression-and-storage.md`](./tickets/TICKET-03-webp-compression-and-storage.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-04** | Monitor de Consumo del Servidor (Free Tier) y Dashboard Admin | [`tickets/TICKET-04-storage-monitor-and-dashboard.md`](./tickets/TICKET-04-storage-monitor-and-dashboard.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-05** | CRUD Completo de Categorías y Subcategorías | [`tickets/TICKET-05-categories-crud.md`](./tickets/TICKET-05-categories-crud.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-06** | CRUD de Productos, Variantes y Galería Drag & Drop | [`tickets/TICKET-06-products-variants-gallery-crud.md`](./tickets/TICKET-06-products-variants-gallery-crud.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-07** | Módulo de Auditoría y Movimientos de Stock | [`tickets/TICKET-07-stock-movements-audit.md`](./tickets/TICKET-07-stock-movements-audit.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-08** | Gestor de Portada y Home Pública 100% Dinámica | [`tickets/TICKET-08-dynamic-home-and-banners.md`](./tickets/TICKET-08-dynamic-home-and-banners.md) | `[x] DONE` | `tsc --noEmit`, `npm test`, `npm run build` |
| **TICKET-09** | Catálogo Público con Filtros por URL y Ficha de Producto (SEO) | [`tickets/TICKET-09-public-catalog-and-product-seo.md`](./tickets/TICKET-09-public-catalog-and-product-seo.md) | `[ ] TODO` | `tsc --noEmit`, `npm test`, `npm run build` |

---

## Regla de Ejecución Autónoma
Para dar por completado (`[x] DONE`) cualquier ticket:
1. Todos los archivos especificados en el ticket deben estar implementados sin `any` injustificados ni código incompleto (`TODO`).
2. `npx tsc --noEmit` debe finalizar con código `0`.
3. `npm test` debe ejecutar las pruebas unitarias de servicios/utilidades con código `0`.
4. `npm run build` debe compilar las rutas de Next.js App Router con código `0`.
