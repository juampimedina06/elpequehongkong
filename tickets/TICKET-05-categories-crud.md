# TICKET-05: CRUD Completo de Categorías y Subcategorías

## 1. Contexto y Objetivo
Permitir gestionar categorías y subcategorías jerárquicas en `/admin/categorias`, consumiendo la vista `categories_with_count`, con subida opcional de imagen WebP y limpieza automática de Storage al editar o eliminar.

**Mejora de Rendimiento y UX:**
- Revalidación quirúrgica (`revalidatePath('/', 'layout')`, `revalidatePath('/admin/categorias')`, `revalidatePath('/catalogo')`) en cada Server Action.
- Prevención de ciclos jerárquicos (una categoría no puede ser `parent_id` de sí misma).

## 2. Archivos a Crear / Modificar
- `services/categories.repository.ts`
- `services/categories.service.ts`
- `actions/categories/categories.actions.ts`
- `components/admin/CategoriesTable.tsx`
- `components/admin/CategoryFormModal.tsx`
- `app/admin/categorias/page.tsx`

## 3. Requisitos Técnicos Exactos
1. **Listado en `/admin/categorias`**:
   - Consulta `categories_with_count` (con fallback transparente si la vista devuelve relaciones desde `categories`).
   - Muestra nombre, slug, categoría padre (si tiene `parent_id`), cantidad de productos asociados (`products_count`), estado (`is_active`) y miniatura.
2. **Formulario Modal de Creación / Edición**:
   - Generación automática de `slug` a partir del nombre (editable manualmente).
   - Selector opcional de categoría padre (`parent_id`).
   - Switch `is_active` y orden de visualización (`display_order`).
   - Subida de imagen comprimida a `.webp` guardando `image_url` y `storage_path`. Si se reemplaza la imagen, se elimina el `storage_path` anterior de `catalog-media`.
3. **Eliminación Segura**:
   - Modal/confirmación informando explícitamente cuántos productos (`products_count`) quedarán "Sin categoría" (`ON DELETE SET NULL`).
   - Al confirmar, elimina la imagen física en `catalog-media` (si tiene `storage_path`) y luego elimina el registro.

## 4. Criterio de Aceptación (Verificación)
- `npx tsc --noEmit` sin errores.
- `npm test` validando creación, actualización con limpieza de imagen previa y borrado de categoría.
- `npm run build` exitoso.
