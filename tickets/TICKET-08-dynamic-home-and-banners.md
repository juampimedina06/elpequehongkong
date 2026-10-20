# TICKET-08: Gestor de Portada y Home Pública 100% Dinámica

## 1. Contexto y Objetivo
Lograr que la portada pública (`/`) sea una vitrina promocional viva, rápida y 100% dinámica, alimentada por banners administrables en `/admin/portada`, los últimos productos ingresados ("Recién Llegados"), una selección rotativa de destacados vía RPC (`get_random_showcase_products`) y la grilla de categorías activas.

**Mejora de Rendimiento y Caché:**
- Carga paralela en el Server Component de `/` (`Promise.all`) para banners, recién llegados, showcase rotativo y categorías.
- Imágenes del Hero con `priority` y `sizes="100vw"` en `next/image` para optimizar el LCP (Largest Contentful Paint).

## 2. Archivos a Crear / Modificar
- `services/banners.repository.ts`
- `services/banners.service.ts`
- `actions/banners/banners.actions.ts`
- `components/admin/BannersManager.tsx`
- `app/admin/portada/page.tsx`
- `components/public/PublicNavbar.tsx`
- `components/public/PublicFooter.tsx`
- `components/public/HeroCarousel.tsx`
- `components/public/CategoryGrid.tsx`
- `components/public/ProductCard.tsx`
- `app/page.tsx`

## 3. Requisitos Técnicos Exactos
1. **Gestor de Portada (`/admin/portada`)**:
   - CRUD completo de `home_banners`: `title`, `subtitle`, `link_url`, `cta_text`, `display_order`, `is_active` y subida de imagen `.webp` a `catalog-media/banners`.
   - Al eliminar o reemplazar la imagen de un banner, borra el archivo físico anterior en `catalog-media` usando `storage_path`.
2. **Home Pública Dinámica (`/`)**:
   - **Hero Carousel**: Carrusel interactivo con transición suave mostrando los `home_banners` con `is_active = true` ordenados por `display_order ASC`.
   - **Grilla Visual de Categorías Activas**: Tarjetas limpias hacia `/catalogo?categoria=[slug]`.
   - **Sección "Recién Llegados"**: Últimos productos con `status = 'active'` ordenados por `created_at DESC`.
   - **Sección "Destacados / Descubrí Más"**: Consume la RPC `get_random_showcase_products` para rotar dinámicamente productos destacados e imágenes en cada visita/revalidación.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` verificando CRUD de banners con limpieza de storage y servicio de showcase dinámico.
- `npm run build` exitoso.
