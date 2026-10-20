import { createClient } from '@/lib/supabase/server'
import type {
  CategoryRow,
  Database,
  HomeBannerRow,
  ProductImageRow,
  ProductStatus,
  ProductVariantRow,
  ProductWithRelations,
} from '@/types/database.types'

export type BannerInsert = Database['public']['Tables']['home_banners']['Insert']
export type BannerUpdate = Database['public']['Tables']['home_banners']['Update']

const BANNER_COLUMNS = `
  id,
  title,
  subtitle,
  image_url,
  storage_path,
  link_url,
  display_order,
  is_active,
  created_at
`

function mapRawBannerRow(raw: Record<string, unknown>): HomeBannerRow {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    subtitle: (raw.subtitle as string | null) ?? null,
    image_url: String(raw.image_url ?? ''),
    storage_path: String(raw.storage_path ?? ''),
    link_url: String(raw.link_url ?? '/catalogo'),
    cta_text: (raw.cta_text as string | null) ?? 'Ver Catálogo',
    display_order: Number(raw.display_order ?? 0),
    is_active: Boolean(raw.is_active),
    created_at: String(raw.created_at ?? ''),
    updated_at: (raw.updated_at as string | null) ?? String(raw.created_at ?? ''),
  }
}

export async function listAllBanners(): Promise<HomeBannerRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('home_banners')
    .select(BANNER_COLUMNS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as unknown as Array<Record<string, unknown>>).map(mapRawBannerRow)
}

export async function listActiveBanners(): Promise<HomeBannerRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('home_banners')
    .select(BANNER_COLUMNS)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as unknown as Array<Record<string, unknown>>).map(mapRawBannerRow)
}

export async function getBannerById(id: string): Promise<HomeBannerRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('home_banners')
    .select(BANNER_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapRawBannerRow(data as unknown as Record<string, unknown>)
}

export async function insertBannerRow(
  payload: BannerInsert
): Promise<HomeBannerRow> {
  const supabase = await createClient()
  // Sanitizar payload: omitir columnas no existentes en la tabla remota
  const { cta_text, ...dbPayload } = (payload ?? {}) as Record<string, unknown>
  const { data, error } = await supabase
    .from('home_banners')
    .insert(dbPayload as never)
    .select(BANNER_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear el banner de portada.')
  }
  return mapRawBannerRow({
    ...(data as Record<string, unknown>),
    cta_text: (cta_text as string | null) ?? 'Ver Catálogo',
  })
}

export async function updateBannerRow(
  id: string,
  payload: BannerUpdate
): Promise<HomeBannerRow> {
  const supabase = await createClient()
  const { cta_text, updated_at, ...dbPayload } = (payload ?? {}) as Record<string, unknown>
  const { data, error } = await supabase
    .from('home_banners')
    .update(dbPayload as never)
    .eq('id', id)
    .select(BANNER_COLUMNS)
    .single()

  if (error || !data) {
    throw new Error(
      error?.message ?? 'No se pudo actualizar el banner de portada.'
    )
  }
  return mapRawBannerRow({
    ...(data as Record<string, unknown>),
    cta_text: (cta_text as string | null) ?? 'Ver Catálogo',
  })
}

export async function deleteBannerRow(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('home_banners').delete().eq('id', id)

  if (error) {
    throw new Error(
      `No se pudo eliminar el banner de portada: ${error.message}`
    )
  }
}

export async function listRecentActiveProductsFromDb(
  limit = 8
): Promise<ProductWithRelations[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
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
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as unknown as Array<Record<string, unknown>>).map((raw) => {
    const rawCat = raw.category
    const category = Array.isArray(rawCat)
      ? ((rawCat[0] as CategoryRow | undefined) ?? null)
      : ((rawCat as CategoryRow | null | undefined) ?? null)

    const variants = Array.isArray(raw.variants)
      ? (raw.variants as ProductVariantRow[]).map((v) => ({
          ...v,
          price_override:
            v.price_override !== null && v.price_override !== undefined
              ? Number(v.price_override)
              : null,
          stock_quantity: Number(v.stock_quantity ?? 0),
          min_stock_alert: Number(v.min_stock_alert ?? 3),
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
      status: (raw.status as ProductStatus) ?? 'active',
      is_featured: Boolean(raw.is_featured),
      created_at: String(raw.created_at ?? ''),
      updated_at: String(raw.updated_at ?? ''),
      category,
      variants,
      images,
    }
  })
}
