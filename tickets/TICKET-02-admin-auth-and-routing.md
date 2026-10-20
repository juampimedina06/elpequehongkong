# TICKET-02: Autenticación de Admin Único y Protección de Rutas (`/admin`)

## 1. Contexto y Objetivo
Proteger el panel administrativo (`/admin/:path*`) asumiendo que el registro público está desactivado y solo existe el usuario Admin en Supabase Auth. Proveer una pantalla `/login` rápida, limpia y editorial, junto con el layout de navegación administrativa (`/admin/layout.tsx`).

**Mejora de Rendimiento:**
En lugar de hacer múltiples consultas por request, el middleware (`middleware.ts` y `proxy.ts`) verificará la sesión únicamente cuando la ruta comience con `/admin` o `/login`, dejando las rutas públicas (`/`, `/catalogo`, `/producto/[slug]`) libres de sobrecarga de verificación de sesión en el borde.

## 2. Archivos a Crear / Modificar
- `middleware.ts` y `proxy.ts`
- `lib/supabase/proxy.ts`
- `actions/auth/auth.ts`
- `actions/auth/get-user.ts`
- `app/(auth)/login/page.tsx`
- `components/auth/SignInForm.tsx`
- `components/auth/LogoutButton.tsx`
- `app/admin/layout.tsx`
- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminHeader.tsx`

## 3. Requisitos Técnicos Exactos
1. **Intercepción de Rutas**:
   - Si el usuario visita `/admin/:path*` sin sesión activa en Supabase Auth, redirigir a `/login?redirect=/admin/...`.
   - Si el usuario tiene sesión activa y visita `/login`, redirigir a `/admin`.
2. **Pantalla `/login`**:
   - Diseño minimalista (`#fafafa`, bordes `zinc-200`, tipografía `zinc-900`).
   - Formulario con `email` y `password`, estados de carga, feedback de error claro y redirección tras login exitoso.
3. **Layout de `/admin`**:
   - Navegación lateral/superior responsiva hacia:
     - `/admin` (Dashboard & Monitor Free Tier)
     - `/admin/productos` (Productos, Variantes y Precios Masivos)
     - `/admin/categorias` (Categorías y Subcategorías)
     - `/admin/stock` (Auditoría y Movimientos de Stock)
     - `/admin/portada` (Banners y Portada Dinámica)
   - Enlace directo a "Ver tienda pública" y botón de "Cerrar sesión".

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` validando lógica de redirección y auth.
- `npm run build` exitoso.
