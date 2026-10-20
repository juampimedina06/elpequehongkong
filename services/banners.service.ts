import { deleteCatalogFiles } from '@/services/storage.service'
import { listActiveCategories } from '@/services/categories.repository'
import { fetchRandomShowcaseProductsRpc } from '@/services/products.repository'
import {
  deleteBannerRow,
  getBannerById,
  insertBannerRow,
  listActiveBanners,
  listAllBanners,
  listRecentActiveProductsFromDb,
  updateBannerRow,
  type BannerInsert,
  type BannerUpdate,
} from '@/services/banners.repository'
import type {
  CategoryRow,
  HomeBannerRow,
  ProductWithRelations,
  ShowcaseProductItem,
} from '@/types/database.types'

export interface BannerMutationInput {
  title: string
  subtitle?: string | null
  image_url: string
  storage_path: string
  link_url?: string | null
  cta_text?: string | null
  display_order?: number
  is_active?: boolean
}

export interface HeroSlideDescriptor {
  id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_url: string
  cta_text: string
  isFallback: boolean
  isPriority: boolean
  sizes: '100vw'
}

export interface DynamicHomeData {
  banners: HomeBannerRow[]
  categories: CategoryRow[]
  newArrivals: ShowcaseProductItem[]
  showcaseProducts: ShowcaseProductItem[]
}

/**
 * Pure input validator and normalizer for `home_banners` mutations.
 */
export function normalizeBannerInput(input: BannerMutationInput): BannerInsert {
  const cleanTitle = (input.title ?? '').trim()
  if (!cleanTitle) {
    throw new Error('El título del banner es obligatorio.')
  }

  const cleanImageUrl = (input.image_url ?? '').trim()
  const cleanStoragePath = (input.storage_path ?? '').trim()
  if (!cleanImageUrl || !cleanStoragePath) {
    throw new Error('La imagen WebP del banner es obligatoria.')
  }

  return {
    title: cleanTitle,
    subtitle: input.subtitle?.trim() ? input.subtitle.trim() : null,
    image_url: cleanImageUrl,
    storage_path: cleanStoragePath,
    link_url: input.link_url?.trim() ? input.link_url.trim() : '/catalogo',
    cta_text: input.cta_text?.trim() ? input.cta_text.trim() : 'Ver Catálogo',
    display_order:
      typeof input.display_order === 'number' &&
      Number.isFinite(input.display_order)
        ? Math.max(0, Math.round(input.display_order))
        : 0,
    is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
  }
}

/**
 * Pure helper resolving slides for `HeroCarousel` (`REQ-HOME-03` & Scenario 8.2).
 * Guarantees first slide has `isPriority: true` and `sizes: "100vw"`, and returns an editorial
 * fallback slide if zero active banners exist.
 */
export function resolveHeroSlides(
  banners: HomeBannerRow[]
): HeroSlideDescriptor[] {
  const active = banners
    .filter((b) => Boolean(b.is_active))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  if (active.length === 0) {
    return [
      {
        id: 'editorial-fallback-hero',
        title: 'Bazar, Regalería y Artículos Selectos',
        subtitle:
          'Explorá nuestro catálogo digital actualizado en tiempo real con disponibilidad inmediata en tienda.',
        image_url: null,
        link_url: '/catalogo',
        cta_text: 'Explorar Catálogo Completo',
        isFallback: true,
        isPriority: true,
        sizes: '100vw',
      },
    ]
  }

  return active.map((banner, index) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image_url: banner.image_url,
    link_url: banner.link_url?.trim() || '/catalogo',
    cta_text: banner.cta_text?.trim() || 'Ver Catálogo',
    isFallback: false,
    isPriority: index === 0,
    sizes: '100vw',
  }))
}

/**
 * Pure mapper converting a `ProductWithRelations` aggregate into a `ShowcaseProductItem`
 * for unified `ProductCard` rendering.
 */
export function mapProductWithRelationsToShowcaseItem(
  product: ProductWithRelations
): ShowcaseProductItem {
  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })

  const activeVariants = (product.variants ?? []).filter(
    (v) => v.is_active !== false
  )

  const totalStock = activeVariants.reduce(
    (sum, v) => sum + Math.max(0, Number(v.stock_quantity ?? 0)),
    0
  )

  const minStockAlert =
    activeVariants.length > 0
      ? Math.min(
          ...activeVariants.map((v) => Math.max(0, Number(v.min_stock_alert ?? 3)))
        )
      : 3

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    base_price: Number(product.base_price),
    compare_at_price:
      product.compare_at_price !== null &&
      product.compare_at_price !== undefined
        ? Number(product.compare_at_price)
        : null,
    category_id: product.category_id,
    category_name: product.category?.name ?? null,
    category_slug: product.category?.slug ?? null,
    primary_image_url: sortedImages[0]?.url ?? null,
    secondary_image_url: sortedImages[1]?.url ?? null,
    total_stock: totalStock,
    min_stock_alert: minStockAlert,
    is_featured: Boolean(product.is_featured),
    created_at: product.created_at,
  }
}

export async function getAdminBannersService(): Promise<HomeBannerRow[]> {
  return listAllBanners()
}

export async function getActiveBannersService(): Promise<HomeBannerRow[]> {
  return listActiveBanners()
}

/**
 * Creates a new promotional banner. Rolls back the uploaded `.webp` file from `catalog-media`
 * if the database insert fails.
 */
export async function createBannerService(
  input: BannerMutationInput,
  deps?: {
    insertRow?: (payload: BannerInsert) => Promise<HomeBannerRow>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<HomeBannerRow> {
  const normalized = normalizeBannerInput(input)
  const insertFn = deps?.insertRow ?? insertBannerRow
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
 * Updates an existing promotional banner (`Scenario 8.1`).
 * Deletes the previous `storage_path` from `catalog-media` when replaced,
 * and rolls back the new `storage_path` if the database update fails.
 */
export async function updateBannerService(
  id: string,
  input: BannerMutationInput,
  deps?: {
    getById?: (id: string) => Promise<HomeBannerRow | null>
    updateRow?: (id: string, payload: BannerUpdate) => Promise<HomeBannerRow>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<HomeBannerRow> {
  const getByIdFn = deps?.getById ?? getBannerById
  const updateFn = deps?.updateRow ?? updateBannerRow
  const deleteStorageFn = deps?.deleteFiles ?? deleteCatalogFiles

  const existing = await getByIdFn(id)
  if (!existing) {
    throw new Error('El banner que intentás editar no existe.')
  }

  const normalized = normalizeBannerInput(input)
  const isReplacedImage =
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
    if (isReplacedImage && normalized.storage_path) {
      await deleteStorageFn([normalized.storage_path]).catch(() => undefined)
    }
    throw err
  }
}

export async function toggleBannerActiveService(
  id: string,
  isActive: boolean,
  deps?: {
    updateRow?: (id: string, payload: BannerUpdate) => Promise<HomeBannerRow>
  }
): Promise<HomeBannerRow> {
  const updateFn = deps?.updateRow ?? updateBannerRow
  return updateFn(id, { is_active: Boolean(isActive) })
}

/**
 * Deletes a banner and physically removes its `.webp` image from `catalog-media`.
 */
export async function deleteBannerService(
  id: string,
  deps?: {
    getById?: (id: string) => Promise<HomeBannerRow | null>
    deleteRow?: (id: string) => Promise<void>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<{
  deletedId: string
  deletedStoragePath: string | null
}> {
  const getByIdFn = deps?.getById ?? getBannerById
  const deleteRowFn = deps?.deleteRow ?? deleteBannerRow
  const deleteStorageFn = deps?.deleteFiles ?? deleteCatalogFiles

  const existing = await getByIdFn(id)
  if (!existing) {
    throw new Error('El banner a eliminar no existe.')
  }

  const pathToDelete = existing.storage_path?.trim() || null
  if (pathToDelete) {
    await deleteStorageFn([pathToDelete])
  }

  await deleteRowFn(id)

  return {
    deletedId: id,
    deletedStoragePath: pathToDelete,
  }
}

/**
 * Fetches all 4 sections of the public homepage in parallel via `Promise.all` (`REQ-HOME-02`):
 * 1. Active `home_banners` (`is_active = true`, `display_order ASC`)
 * 2. Active `categories` (`is_active = true`, `display_order ASC`)
 * 3. New Arrivals (`status = 'active'`, `created_at DESC`, limit 8)
 * 4. Rotating Showcase via `get_random_showcase_products` RPC (with resilient fallback)
 */
export async function getDynamicHomeDataService(deps?: {
  fetchActiveBanners?: () => Promise<HomeBannerRow[]>
  fetchActiveCategories?: () => Promise<CategoryRow[]>
  fetchRecentActiveProducts?: (limit: number) => Promise<ShowcaseProductItem[]>
  fetchShowcaseRpc?: (limit: number) => Promise<ShowcaseProductItem[] | null>
}): Promise<DynamicHomeData> {
  const bannersFn = deps?.fetchActiveBanners ?? listActiveBanners
  const categoriesFn = deps?.fetchActiveCategories ?? listActiveCategories
  const recentFn =
    deps?.fetchRecentActiveProducts ??
    (async (limit: number) => {
      const rows = await listRecentActiveProductsFromDb(limit)
      return rows.map(mapProductWithRelationsToShowcaseItem)
    })
  const showcaseRpcFn = deps?.fetchShowcaseRpc ?? fetchRandomShowcaseProductsRpc

  const [banners, categories, newArrivals, showcaseFromRpc] =
    await Promise.all([
      bannersFn(),
      categoriesFn(),
      recentFn(8),
      showcaseRpcFn(8),
    ])

  const showcaseProducts =
    showcaseFromRpc && showcaseFromRpc.length > 0
      ? showcaseFromRpc
      : [...newArrivals].sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
          return b.created_at.localeCompare(a.created_at)
        })

  return {
    banners,
    categories,
    newArrivals,
    showcaseProducts,
  }
}
