import { slugify } from '@/utils/formatters'
import { deleteCatalogFiles } from '@/services/storage.service'
import {
  deleteCategoryRow,
  getCategoryById,
  getCategoryByIdWithCount,
  insertCategoryRow,
  listActiveCategories,
  listCategoriesMinimal,
  listCategoriesWithCount,
  updateCategoryRow,
  type CategoryInsert,
  type CategoryUpdate,
} from '@/services/categories.repository'
import type { CategoryRow, CategoryWithCountRow } from '@/types/database.types'

export interface CategoryMutationInput {
  name: string
  slug?: string | null
  description?: string | null
  parent_id?: string | null
  image_url?: string | null
  storage_path?: string | null
  is_active?: boolean
  display_order?: number
}

export interface DeleteCategoryResult {
  deletedId: string
  affectedProductsCount: number
  deletedStoragePath: string | null
}

/**
 * Validates that setting `parentId` on `categoryId` does not create a self-parenting
 * or ancestor hierarchy cycle.
 */
export function validateCategoryHierarchy(
  categoryId: string | null | undefined,
  parentId: string | null | undefined,
  existingCategories: Array<Pick<CategoryRow, 'id' | 'parent_id'>> = []
): void {
  const normalizedParentId = parentId?.trim() || null
  if (!normalizedParentId || !categoryId) return

  if (categoryId === normalizedParentId) {
    throw new Error(
      'Una categoría no puede ser categoría padre de sí misma.'
    )
  }

  const parentMap = new Map<string, string | null>()
  for (const item of existingCategories) {
    parentMap.set(item.id, item.parent_id ?? null)
  }

  let cursor: string | null = normalizedParentId
  const visited = new Set<string>([categoryId])

  while (cursor) {
    if (visited.has(cursor)) {
      throw new Error(
        'Ciclo jerárquico detectado: no se puede asignar una subcategoría descendiente como categoría padre.'
      )
    }
    visited.add(cursor)
    cursor = parentMap.get(cursor) ?? null
  }
}

/**
 * Validates and normalizes category creation/update input fields.
 */
export function normalizeCategoryInput(
  input: CategoryMutationInput
): CategoryInsert {
  const cleanName = (input.name ?? '').trim()
  if (!cleanName) {
    throw new Error('El nombre de la categoría es obligatorio.')
  }

  const resolvedSlug = slugify(input.slug?.trim() || cleanName)
  if (!resolvedSlug) {
    throw new Error('El slug de la categoría no es válido.')
  }

  const parentId = input.parent_id?.trim() ? input.parent_id.trim() : null
  const description = input.description?.trim() ? input.description.trim() : null
  const imageUrl = input.image_url?.trim() ? input.image_url.trim() : null
  const storagePath = input.storage_path?.trim() ? input.storage_path.trim() : null
  const isActive = input.is_active !== undefined ? Boolean(input.is_active) : true
  const displayOrder =
    typeof input.display_order === 'number' && Number.isFinite(input.display_order)
      ? Math.max(0, Math.round(input.display_order))
      : 0

  return {
    name: cleanName,
    slug: resolvedSlug,
    description,
    parent_id: parentId,
    image_url: imageUrl,
    storage_path: storagePath,
    is_active: isActive,
    display_order: displayOrder,
  }
}

/**
 * Returns categories with product counts and resolved `parent_name` for admin listing.
 */
export async function getCategoriesWithCountService(deps?: {
  listWithCount?: () => Promise<CategoryWithCountRow[]>
}): Promise<CategoryWithCountRow[]> {
  const fetchFn = deps?.listWithCount ?? listCategoriesWithCount
  const rows = await fetchFn()
  const nameById = new Map<string, string>()

  for (const row of rows) {
    nameById.set(row.id, row.name)
  }

  return rows.map((row) => ({
    ...row,
    parent_name: row.parent_id ? (nameById.get(row.parent_id) ?? null) : null,
  }))
}

export async function getActiveCategoriesService(): Promise<CategoryRow[]> {
  return listActiveCategories()
}

/**
 * Creates a new category. If the DB insert fails and a `.webp` image was already uploaded,
 * physically rolls back the orphaned file from `catalog-media`.
 */
export async function createCategoryService(
  input: CategoryMutationInput,
  deps?: {
    insertRow?: (payload: CategoryInsert) => Promise<CategoryRow>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<CategoryRow> {
  const normalized = normalizeCategoryInput(input)
  const insertFn = deps?.insertRow ?? insertCategoryRow
  const deleteStorageFn = deps?.deleteFiles ?? deleteCatalogFiles

  try {
    return await insertFn(normalized)
  } catch (err) {
    if (normalized.storage_path) {
      await deleteStorageFn([normalized.storage_path]).catch(() => undefined)
    }
    throw err
  }
}

/**
 * Updates an existing category, enforcing cycle prevention (`parent_id !== id` and ancestor check),
 * and deleting the previous `storage_path` from `catalog-media` when the image is replaced or cleared.
 */
export async function updateCategoryService(
  id: string,
  input: CategoryMutationInput,
  deps?: {
    getById?: (id: string) => Promise<CategoryRow | null>
    listAllMinimal?: () => Promise<Array<Pick<CategoryRow, 'id' | 'parent_id'>>>
    updateRow?: (id: string, payload: CategoryUpdate) => Promise<CategoryRow>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<CategoryRow> {
  const getByIdFn = deps?.getById ?? getCategoryById
  const listMinimalFn = deps?.listAllMinimal ?? listCategoriesMinimal
  const updateFn = deps?.updateRow ?? updateCategoryRow
  const deleteStorageFn = deps?.deleteFiles ?? deleteCatalogFiles

  const existing = await getByIdFn(id)
  if (!existing) {
    throw new Error('La categoría seleccionada no existe.')
  }

  const normalized = normalizeCategoryInput(input)
  const minimalCategories = await listMinimalFn()

  validateCategoryHierarchy(id, normalized.parent_id, minimalCategories)

  const isNewUploadedFile =
    Boolean(normalized.storage_path) &&
    normalized.storage_path !== existing.storage_path

  try {
    const updated = await updateFn(id, normalized)

    if (
      existing.storage_path &&
      existing.storage_path !== normalized.storage_path
    ) {
      await deleteStorageFn([existing.storage_path]).catch(() => undefined)
    }

    return updated
  } catch (err) {
    if (isNewUploadedFile && normalized.storage_path) {
      await deleteStorageFn([normalized.storage_path]).catch(() => undefined)
    }
    throw err
  }
}

/**
 * Deletes a category, removing its `.webp` image from `catalog-media` first
 * and returning the `affectedProductsCount` metadata.
 */
export async function deleteCategoryService(
  id: string,
  deps?: {
    getByIdWithCount?: (id: string) => Promise<CategoryWithCountRow | null>
    deleteRow?: (id: string) => Promise<void>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<DeleteCategoryResult> {
  const getWithCountFn = deps?.getByIdWithCount ?? getCategoryByIdWithCount
  const deleteRowFn = deps?.deleteRow ?? deleteCategoryRow
  const deleteStorageFn = deps?.deleteFiles ?? deleteCatalogFiles

  const existing = await getWithCountFn(id)
  if (!existing) {
    throw new Error('La categoría a eliminar no existe.')
  }

  const storagePathToRemove = existing.storage_path ?? null

  if (storagePathToRemove) {
    await deleteStorageFn([storagePathToRemove])
  }

  await deleteRowFn(id)

  return {
    deletedId: id,
    affectedProductsCount: existing.products_count ?? 0,
    deletedStoragePath: storagePathToRemove,
  }
}
