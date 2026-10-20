import { createClient } from '@/lib/supabase/server'
import type {
  CategoryRow,
  CategoryWithCountRow,
  Database,
} from '@/types/database.types'

export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

const CATEGORY_COLUMNS =
  'id, name, slug, description, parent_id, image_url, storage_path, is_active, display_order, created_at, updated_at'

/**
 * Fetches categories from `categories_with_count` view, falling back to `categories` + product count
 * aggregation if the view is not yet available.
 */
export async function listCategoriesWithCount(): Promise<CategoryWithCountRow[]> {
  const supabase = await createClient()

  const { data: viewData, error: viewError } = await supabase
    .from('categories_with_count')
    .select(
      'id, name, slug, description, parent_id, image_url, storage_path, is_active, display_order, created_at, updated_at, products_count'
    )
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (!viewError && viewData) {
    return (viewData as unknown as CategoryWithCountRow[]).map((row) => ({
      ...row,
      products_count: Number(row.products_count ?? 0),
    }))
  }

  // Transparent fallback if categories_with_count view is unavailable
  const [{ data: categoriesData, error: catError }, { data: productsData }] =
    await Promise.all([
      supabase
        .from('categories')
        .select(CATEGORY_COLUMNS)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase.from('products').select('id, category_id'),
    ])

  if (catError || !categoriesData) {
    return []
  }

  const countMap = new Map<string, number>()
  for (const prod of (productsData ?? []) as Array<{
    id: string
    category_id: string | null
  }>) {
    if (prod.category_id) {
      countMap.set(prod.category_id, (countMap.get(prod.category_id) ?? 0) + 1)
    }
  }

  return (categoriesData as unknown as CategoryRow[]).map((cat) => ({
    ...cat,
    products_count: countMap.get(cat.id) ?? 0,
  }))
}

export async function listActiveCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error || !data) return []
  return data as unknown as CategoryRow[]
}

export async function listCategoriesMinimal(): Promise<
  Array<Pick<CategoryRow, 'id' | 'parent_id'>>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id')

  if (error || !data) return []
  return data as unknown as Array<Pick<CategoryRow, 'id' | 'parent_id'>>
}

export async function getCategoryById(
  id: string
): Promise<CategoryRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as CategoryRow
}

export async function getCategoryByIdWithCount(
  id: string
): Promise<CategoryWithCountRow | null> {
  const all = await listCategoriesWithCount()
  return all.find((c) => c.id === id) ?? null
}

export async function insertCategoryRow(
  payload: CategoryInsert
): Promise<CategoryRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert(payload as never)
    .select(CATEGORY_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(
      error?.message ?? 'No se pudo crear la categoría en la base de datos.'
    )
  }

  return data as unknown as CategoryRow
}

export async function updateCategoryRow(
  id: string,
  payload: CategoryUpdate
): Promise<CategoryRow> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select(CATEGORY_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(
      error?.message ?? 'No se pudo actualizar la categoría en la base de datos.'
    )
  }

  return data as unknown as CategoryRow
}

export async function deleteCategoryRow(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    throw new Error(`No se pudo eliminar la categoría: ${error.message}`)
  }
}
