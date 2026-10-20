import { createClient } from '@/lib/supabase/server'
import type {
  CategoryRow,
  Database,
  ProductImageRow,
  ProductRow,
  ProductStatus,
  ProductVariantRow,
  ProductWithRelations,
  ShowcaseProductItem,
} from '@/types/database.types'

export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type VariantInsert =
  Database['public']['Tables']['product_variants']['Insert']
export type ImageInsert =
  Database['public']['Tables']['product_images']['Insert']

const PRODUCT_RELATION_SELECT = `
  id,
  category_id,
  name,
  slug,
  description,
  base_price,
  compare_at_price,
  status,
  is_featured,
  created_at,
  updated_at,
  category:categories (
    id,
    name,
    slug,
    description,
    parent_id,
    image_url,
    storage_path,
    is_active,
    display_order,
    created_at,
    updated_at
  ),
  variants:product_variants (
    id,
    product_id,
    sku,
    name,
    size,
    color,
    dimensions,
    price_override,
    stock_quantity,
    min_stock_alert,
    image_id,
    is_active,
    created_at,
    updated_at
  ),
  images:product_images (
    id,
    product_id,
    variant_id,
    url,
    storage_path,
    alt_text,
    display_order,
    is_primary,
    created_at
  )
`

function mapRawProductWithRelations(raw: Record<string, unknown>): ProductWithRelations {
  const rawCategory = raw.category
  const category = Array.isArray(rawCategory)
    ? ((rawCategory[0] as CategoryRow | undefined) ?? null)
    : ((rawCategory as CategoryRow | null | undefined) ?? null)

  const variants = Array.isArray(raw.variants)
    ? (raw.variants as ProductVariantRow[]).map((v) => ({
        ...v,
        price_override:
          v.price_override !== null && v.price_override !== undefined
            ? Number(v.price_override)
            : null,
        stock_quantity: Number(v.stock_quantity ?? 0),
        min_stock_alert: Number(v.min_stock_alert ?? 0),
      }))
    : []

  const images = Array.isArray(raw.images)
    ? [...(raw.images as ProductImageRow[])].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      )
    : []

  return {
    id: String(raw.id),
    category_id: (raw.category_id as string | null) ?? null,
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    description: (raw.description as string | null) ?? null,
    base_price: Number(raw.base_price ?? 0),
    compare_at_price:
      raw.compare_at_price !== null && raw.compare_at_price !== undefined
        ? Number(raw.compare_at_price)
        : null,
    status: (raw.status as ProductStatus) ?? 'draft',
    is_featured: Boolean(raw.is_featured),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
    category,
    variants,
    images,
  }
}

export async function listAdminProductsWithRelations(): Promise<
  ProductWithRelations[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_RELATION_SELECT)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as unknown as Array<Record<string, unknown>>).map(
    mapRawProductWithRelations
  )
}

export async function listActiveProductsWithRelations(): Promise<
  ProductWithRelations[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_RELATION_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as unknown as Array<Record<string, unknown>>).map(
    mapRawProductWithRelations
  )
}

export async function getProductByIdWithRelations(
  id: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_RELATION_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapRawProductWithRelations(data as unknown as Record<string, unknown>)
}

export async function getActiveProductBySlugWithRelations(
  slug: string
): Promise<ProductWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_RELATION_SELECT)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) return null
  return mapRawProductWithRelations(data as unknown as Record<string, unknown>)
}

export async function fetchProductsPricingByIds(
  ids: string[]
): Promise<
  Array<Pick<ProductRow, 'id' | 'slug' | 'base_price' | 'compare_at_price'>>
> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, base_price, compare_at_price')
    .in('id', ids)

  if (error || !data) return []
  return (
    data as unknown as Array<
      Pick<ProductRow, 'id' | 'slug' | 'base_price' | 'compare_at_price'>
    >
  ).map((row) => ({
    ...row,
    base_price: Number(row.base_price),
    compare_at_price:
      row.compare_at_price !== null && row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : null,
  }))
}

export async function updateProductPriceFieldsRow(
  id: string,
  patch: { base_price: number; compare_at_price: number | null }
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      base_price: patch.base_price,
      compare_at_price: patch.compare_at_price,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)

  if (error) {
    throw new Error(
      `No se pudo actualizar el precio del producto (${id}): ${error.message}`
    )
  }
}

export async function updateProductQuickFieldsRow(
  id: string,
  patch: { base_price?: number; is_featured?: boolean; status?: ProductStatus }
): Promise<ProductWithRelations> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)

  if (error) {
    throw new Error(`No se pudo actualizar el producto: ${error.message}`)
  }

  const refreshed = await getProductByIdWithRelations(id)
  if (!refreshed) {
    throw new Error('No se encontró el producto luego de actualizar.')
  }
  return refreshed
}

export async function deleteProductRowById(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    throw new Error(`No se pudo eliminar el producto: ${error.message}`)
  }
}

export interface PersistProductAggregatePayload {
  id?: string
  product: ProductInsert
  variants: Array<
    Omit<VariantInsert, 'product_id'> & {
      id?: string
      tempKey?: string
    }
  >
  images: Array<
    Omit<ImageInsert, 'product_id'> & {
      id?: string
      linkedVariantTempKey?: string | null
    }
  >
}

/**
 * Persists a product along with its dynamic variants and ordered gallery images.
 * Synchronizes variants and images, preserving existing variant IDs (and stock audit history)
 * when editing.
 */
export async function persistProductAggregateInDb(
  payload: PersistProductAggregatePayload
): Promise<ProductWithRelations> {
  const supabase = await createClient()
  let productId = payload.id

  if (productId) {
    const { error: prodUpdateErr } = await supabase
      .from('products')
      .update({
        ...payload.product,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', productId)

    if (prodUpdateErr) {
      throw new Error(`Error al actualizar producto: ${prodUpdateErr.message}`)
    }
  } else {
    const { data: createdProd, error: prodInsertErr } = await supabase
      .from('products')
      .insert(payload.product as never)
      .select('id')
      .single()

    if (prodInsertErr || !createdProd) {
      throw new Error(
        prodInsertErr?.message ?? 'No se pudo insertar el producto.'
      )
    }
    productId = (createdProd as { id: string }).id
  }

  // Synchronize variants
  const { data: existingVariantsData } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)

  const existingVariantIds = new Set(
    ((existingVariantsData ?? []) as Array<{ id: string }>).map((v) => v.id)
  )
  const incomingVariantIds = new Set(
    payload.variants.map((v) => v.id).filter((id): id is string => Boolean(id))
  )

  const variantIdsToDelete = Array.from(existingVariantIds).filter(
    (id) => !incomingVariantIds.has(id)
  )
  if (variantIdsToDelete.length > 0) {
    const { error: delVarErr } = await supabase
      .from('product_variants')
      .delete()
      .in('id', variantIdsToDelete)
    if (delVarErr) {
      throw new Error(`Error al eliminar variantes removidas: ${delVarErr.message}`)
    }
  }

  const tempKeyToVariantId = new Map<string, string>()

  for (const variant of payload.variants) {
    const rowData: VariantInsert = {
      product_id: productId,
      name: variant.name,
      sku: variant.sku ?? null,
      size: variant.size ?? null,
      color: variant.color ?? null,
      dimensions: variant.dimensions ?? null,
      price_override: variant.price_override ?? null,
      stock_quantity: variant.stock_quantity ?? 0,
      min_stock_alert: variant.min_stock_alert ?? 3,
      is_active: variant.is_active ?? true,
    }

    if (variant.id && existingVariantIds.has(variant.id)) {
      const { error: updVarErr } = await supabase
        .from('product_variants')
        .update({
          ...rowData,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', variant.id)

      if (updVarErr) {
        throw new Error(`Error al actualizar variante "${variant.name}": ${updVarErr.message}`)
      }
      if (variant.tempKey) {
        tempKeyToVariantId.set(variant.tempKey, variant.id)
      }
      tempKeyToVariantId.set(variant.id, variant.id)
    } else {
      const { data: insertedVar, error: insVarErr } = await supabase
        .from('product_variants')
        .insert(rowData as never)
        .select('id')
        .single()

      if (insVarErr || !insertedVar) {
        throw new Error(
          insVarErr?.message ?? `Error al crear variante "${variant.name}".`
        )
      }
      const newVarId = (insertedVar as { id: string }).id
      if (variant.tempKey) {
        tempKeyToVariantId.set(variant.tempKey, newVarId)
      }
    }
  }

  // Synchronize product_images
  const { error: clearImgErr } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)

  if (clearImgErr) {
    throw new Error(`Error al sincronizar galería: ${clearImgErr.message}`)
  }

  if (payload.images.length > 0) {
    const imageRowsToInsert: ImageInsert[] = payload.images.map((img, index) => {
      const resolvedVariantId =
        img.variant_id && tempKeyToVariantId.has(img.variant_id)
          ? tempKeyToVariantId.get(img.variant_id)!
          : img.linkedVariantTempKey &&
            tempKeyToVariantId.has(img.linkedVariantTempKey)
          ? tempKeyToVariantId.get(img.linkedVariantTempKey)!
          : img.variant_id && existingVariantIds.has(img.variant_id)
          ? img.variant_id
          : null

      return {
        product_id: productId!,
        variant_id: resolvedVariantId,
        url: img.url,
        storage_path: img.storage_path,
        alt_text: img.alt_text ?? payload.product.name,
        display_order: index,
        is_primary: Boolean(img.is_primary),
      }
    })

    const { error: insImgErr } = await supabase
      .from('product_images')
      .insert(imageRowsToInsert as never)

    if (insImgErr) {
      throw new Error(`Error al guardar imágenes de galería: ${insImgErr.message}`)
    }
  }

  const complete = await getProductByIdWithRelations(productId)
  if (!complete) {
    throw new Error('No se pudo recuperar el producto guardado.')
  }

  return complete
}

export async function fetchRandomShowcaseProductsRpc(
  limit = 8
): Promise<ShowcaseProductItem[] | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_random_showcase_products', {
      p_limit: limit,
    } as never)
    if (error || !data) return null
    return data as unknown as ShowcaseProductItem[]
  } catch {
    return null
  }
}
