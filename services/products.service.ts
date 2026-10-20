import { slugify } from '@/utils/formatters'
import { deleteCatalogFiles } from '@/services/storage.service'
import {
  deleteProductRowById,
  deleteProductStorageFilesServer,
  fetchProductsPricingByIds,
  getActiveProductBySlugWithRelations,
  getProductByIdWithRelations,
  listActiveProductsWithRelations,
  listAdminProductsWithRelations,
  persistProductAggregateInDb,
  updateProductPriceFieldsRow,
  updateProductQuickFieldsRow,
  type PersistProductAggregatePayload,
} from '@/services/products.repository'
import type {
  ProductRow,
  ProductStatus,
  ProductWithRelations,
} from '@/types/database.types'

export interface AdminProductFilterInput {
  q?: string
  categoryId?: string
  status?: ProductStatus | 'all' | ''
}

export interface ProductVariantMutationInput {
  id?: string
  tempKey?: string
  name: string
  sku?: string | null
  size?: string | null
  color?: string | null
  dimensions?: string | null
  price_override?: number | null
  stock_quantity?: number
  min_stock_alert?: number
  is_active?: boolean
}

export interface ProductGalleryImageInput {
  id?: string
  url: string
  storage_path: string
  alt_text?: string | null
  display_order?: number
  is_primary?: boolean
  variant_id?: string | null
  linkedVariantTempKey?: string | null
}

export interface SaveProductWithRelationsInput {
  id?: string
  name: string
  slug?: string | null
  category_id?: string | null
  description?: string | null
  base_price: number
  compare_at_price?: number | null
  status?: ProductStatus
  is_featured?: boolean
  variants: ProductVariantMutationInput[]
  images: ProductGalleryImageInput[]
  newlyUploadedStoragePaths?: string[]
}

export interface BulkPriceUpdateInput {
  productIds: string[]
  percentageChange: number
  roundToNearest?: number
  updateCompareAtPrice?: boolean
}

export interface BulkPriceCalculationResult {
  newBasePrice: number
  newCompareAtPrice: number | null
}

/**
 * Pure function that filters admin product rows by search query (name or variant SKU),
 * category ID, and product status.
 */
export function filterAdminProducts(
  products: ProductWithRelations[],
  filters: AdminProductFilterInput
): ProductWithRelations[] {
  const query = (filters.q ?? '').trim().toLowerCase()
  const categoryId = (filters.categoryId ?? '').trim()
  const status = (filters.status ?? '').trim()

  return products.filter((product) => {
    if (categoryId && categoryId !== 'all' && product.category_id !== categoryId) {
      return false
    }

    if (
      status &&
      status !== 'all' &&
      product.status !== (status as ProductStatus)
    ) {
      return false
    }

    if (query) {
      const matchesName = product.name.toLowerCase().includes(query)
      const matchesSlug = product.slug.toLowerCase().includes(query)
      const matchesSku = product.variants.some((v) =>
        (v.sku ?? '').toLowerCase().includes(query)
      )
      if (!matchesName && !matchesSlug && !matchesSku) {
        return false
      }
    }

    return true
  })
}

/**
 * Normalizes gallery image ordering (0..N-1) and guarantees that if at least one image exists,
 * exactly one image is marked `is_primary = true`.
 */
export function normalizeProductGalleryOrder(
  images: ProductGalleryImageInput[]
): Array<
  ProductGalleryImageInput & {
    display_order: number
    is_primary: boolean
  }
> {
  if (images.length === 0) return []

  const sorted = [...images].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  )

  let primaryIndex = sorted.findIndex((img) => Boolean(img.is_primary))
  if (primaryIndex === -1) {
    primaryIndex = 0
  }

  return sorted.map((img, index) => ({
    ...img,
    display_order: index,
    is_primary: index === primaryIndex,
  }))
}

/**
 * Computes which `storage_path` entries existed previously on a product
 * but were removed in the updated gallery list so they can be deleted from `catalog-media`.
 */
export function computeDiscardedStoragePaths(
  previousPaths: Array<string | null | undefined>,
  retainedPaths: Array<string | null | undefined>
): string[] {
  const retainedSet = new Set(
    retainedPaths
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean)
  )

  const discarded: string[] = []
  for (const prev of previousPaths) {
    const clean = typeof prev === 'string' ? prev.trim() : ''
    if (clean && !retainedSet.has(clean) && !discarded.includes(clean)) {
      discarded.push(clean)
    }
  }

  return discarded
}

/**
 * Pure deterministic calculation for bulk percentage price adjustments.
 * Supports optional rounding (`roundToNearest`: 1, 10, 100) and optional copying
 * of `currentPrice` into `compare_at_price`.
 */
export function calculateBulkUpdatedPrice(params: {
  currentPrice: number
  currentCompareAtPrice: number | null
  percentageChange: number
  roundToNearest?: number
  updateCompareAtPrice?: boolean
}): BulkPriceCalculationResult {
  const {
    currentPrice,
    currentCompareAtPrice,
    percentageChange,
    roundToNearest = 1,
    updateCompareAtPrice = false,
  } = params

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    throw new Error('El precio actual del producto debe ser mayor a 0.')
  }

  if (!Number.isFinite(percentageChange) || percentageChange <= -100) {
    throw new Error(
      'El porcentaje de ajuste debe producir un precio final mayor a 0.'
    )
  }

  const multiplier = 1 + percentageChange / 100
  const rawNewPrice = currentPrice * multiplier

  const step =
    Number.isFinite(roundToNearest) && roundToNearest > 0
      ? roundToNearest
      : 1
  const newBasePrice =
    step > 1
      ? Math.round(rawNewPrice / step) * step
      : Math.round(rawNewPrice * 100) / 100

  if (newBasePrice <= 0) {
    throw new Error('El nuevo precio calculado debe ser mayor a 0.')
  }

  const newCompareAtPrice = updateCompareAtPrice
    ? currentPrice
    : currentCompareAtPrice

  return {
    newBasePrice,
    newCompareAtPrice,
  }
}

export async function getAdminProductsService(): Promise<ProductWithRelations[]> {
  return listAdminProductsWithRelations()
}

export async function getProductByIdService(
  id: string
): Promise<ProductWithRelations | null> {
  return getProductByIdWithRelations(id)
}

export async function getActiveProductBySlugService(
  slug: string
): Promise<ProductWithRelations | null> {
  return getActiveProductBySlugWithRelations(slug)
}

/**
 * Saves (creates or updates) a product along with its dynamic variants and ordered WebP gallery.
 * - Rolls back `newlyUploadedStoragePaths` from `catalog-media` if the database operation fails.
 * - Deletes discarded gallery `storage_path` blobs from `catalog-media` when editing an existing product.
 */
export async function saveProductWithRelationsService(
  input: SaveProductWithRelationsInput,
  deps?: {
    getExistingProduct?: (id: string) => Promise<ProductWithRelations | null>
    persistProductAggregate?: (
      payload: PersistProductAggregatePayload
    ) => Promise<ProductWithRelations>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<ProductWithRelations> {
  const cleanName = (input.name ?? '').trim()
  if (!cleanName) {
    throw new Error('El nombre del producto es obligatorio.')
  }

  const resolvedSlug = slugify(input.slug?.trim() || cleanName)
  if (!resolvedSlug) {
    throw new Error('El slug del producto no es válido.')
  }

  const basePrice = Number(input.base_price)
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error('El precio base del producto debe ser mayor a 0.')
  }

  const compareAtPrice =
    input.compare_at_price !== null &&
    input.compare_at_price !== undefined &&
    Number(input.compare_at_price) > 0
      ? Number(input.compare_at_price)
      : null

  const getExistingFn = deps?.getExistingProduct ?? getProductByIdWithRelations
  const persistFn = deps?.persistProductAggregate ?? persistProductAggregateInDb
  const deleteStorageFn = deps?.deleteFiles ?? deleteProductStorageFilesServer

  const newlyUploaded = input.newlyUploadedStoragePaths ?? []

  let existingProduct: ProductWithRelations | null = null
  if (input.id) {
    existingProduct = await getExistingFn(input.id)
    if (!existingProduct) {
      if (newlyUploaded.length > 0) {
        await deleteStorageFn(newlyUploaded).catch(() => undefined)
      }
      throw new Error('El producto que intentás editar no existe.')
    }
  }

  const normalizedGallery = normalizeProductGalleryOrder(input.images ?? [])

  const rawVariants =
    input.variants && input.variants.length > 0
      ? input.variants
      : [
          {
            name: 'Única',
            sku: null,
            size: null,
            color: null,
            dimensions: null,
            price_override: null,
            stock_quantity: 0,
            min_stock_alert: 3,
            is_active: true,
          },
        ]

  const sanitizedVariants = rawVariants.map((v, idx) => ({
    id: v.id,
    tempKey: v.tempKey,
    name: (v.name ?? '').trim() || `Variante ${idx + 1}`,
    sku: v.sku?.trim() ? v.sku.trim() : null,
    size: v.size?.trim() ? v.size.trim() : null,
    color: v.color?.trim() ? v.color.trim() : null,
    dimensions: v.dimensions?.trim() ? v.dimensions.trim() : null,
    price_override:
      v.price_override !== null &&
      v.price_override !== undefined &&
      Number(v.price_override) > 0
        ? Number(v.price_override)
        : null,
    stock_quantity: Math.max(0, Math.round(Number(v.stock_quantity ?? 0))),
    min_stock_alert: Math.max(0, Math.round(Number(v.min_stock_alert ?? 3))),
    is_active: v.is_active !== undefined ? Boolean(v.is_active) : true,
  }))

  const payload: PersistProductAggregatePayload = {
    id: input.id,
    product: {
      name: cleanName,
      slug: resolvedSlug,
      category_id: input.category_id?.trim() ? input.category_id.trim() : null,
      description: input.description?.trim() ? input.description.trim() : null,
      base_price: basePrice,
      compare_at_price: compareAtPrice,
      status: input.status ?? 'draft',
      is_featured: Boolean(input.is_featured),
    },
    variants: sanitizedVariants,
    images: normalizedGallery.map((img) => ({
      id: img.id,
      url: img.url,
      storage_path: img.storage_path,
      alt_text: img.alt_text?.trim() || cleanName,
      display_order: img.display_order,
      is_primary: img.is_primary,
      variant_id: img.variant_id ?? null,
      linkedVariantTempKey: img.linkedVariantTempKey ?? null,
    })),
  }

  try {
    const saved = await persistFn(payload)

    if (existingProduct) {
      const previousPaths = existingProduct.images.map((i) => i.storage_path)
      const retainedPaths = normalizedGallery.map((i) => i.storage_path)
      const discardedPaths = computeDiscardedStoragePaths(
        previousPaths,
        retainedPaths
      )

      if (discardedPaths.length > 0) {
        await deleteStorageFn(discardedPaths).catch(() => undefined)
      }
    }

    return saved
  } catch (err) {
    if (newlyUploaded.length > 0) {
      await deleteStorageFn(newlyUploaded).catch(() => undefined)
    }
    throw err
  }
}

/**
 * Inline quick update for `base_price`, `is_featured`, or `status` directly from `ProductsTable`.
 */
export async function updateProductQuickFieldsService(
  id: string,
  patch: {
    base_price?: number
    is_featured?: boolean
    status?: ProductStatus
  },
  deps?: {
    updateQuickFields?: (
      id: string,
      patch: {
        base_price?: number
        is_featured?: boolean
        status?: ProductStatus
      }
    ) => Promise<ProductWithRelations>
  }
): Promise<ProductWithRelations> {
  if (patch.base_price !== undefined) {
    const numericPrice = Number(patch.base_price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      throw new Error('El precio base debe ser mayor a 0.')
    }
  }

  const updateFn = deps?.updateQuickFields ?? updateProductQuickFieldsRow
  return updateFn(id, patch)
}

/**
 * Applies a bulk percentage price update to the selected product IDs.
 */
export async function bulkUpdateProductPricesService(
  input: BulkPriceUpdateInput,
  deps?: {
    fetchProductsByIds?: (
      ids: string[]
    ) => Promise<
      Array<Pick<ProductRow, 'id' | 'slug' | 'base_price' | 'compare_at_price'>>
    >
    updateProductPriceRow?: (
      id: string,
      patch: { base_price: number; compare_at_price: number | null }
    ) => Promise<void>
  }
): Promise<{
  updatedCount: number
  updatedSlugs: string[]
}> {
  const uniqueIds = Array.from(
    new Set((input.productIds ?? []).map((id) => id.trim()).filter(Boolean))
  )

  if (uniqueIds.length === 0) {
    throw new Error('Seleccioná al menos un producto para actualizar precios.')
  }

  if (
    !Number.isFinite(input.percentageChange) ||
    input.percentageChange === 0
  ) {
    throw new Error(
      'Ingresá un porcentaje de variación distinto de 0% (ej: 15 o -10).'
    )
  }

  const fetchFn = deps?.fetchProductsByIds ?? fetchProductsPricingByIds
  const updateRowFn = deps?.updateProductPriceRow ?? updateProductPriceFieldsRow

  const products = await fetchFn(uniqueIds)
  if (products.length === 0) {
    throw new Error('No se encontraron los productos seleccionados.')
  }

  const plannedUpdates = products.map((product) => {
    const calculated = calculateBulkUpdatedPrice({
      currentPrice: Number(product.base_price),
      currentCompareAtPrice: product.compare_at_price,
      percentageChange: input.percentageChange,
      roundToNearest: input.roundToNearest,
      updateCompareAtPrice: input.updateCompareAtPrice,
    })

    return {
      id: product.id,
      slug: product.slug,
      base_price: calculated.newBasePrice,
      compare_at_price: calculated.newCompareAtPrice,
    }
  })

  await Promise.all(
    plannedUpdates.map((item) =>
      updateRowFn(item.id, {
        base_price: item.base_price,
        compare_at_price: item.compare_at_price,
      })
    )
  )

  return {
    updatedCount: plannedUpdates.length,
    updatedSlugs: plannedUpdates.map((u) => u.slug),
  }
}

/**
 * Deletes a product and physically cleans up all of its gallery images from `catalog-media`.
 */
export async function deleteProductService(
  id: string,
  deps?: {
    getExistingProduct?: (id: string) => Promise<ProductWithRelations | null>
    deleteProductRow?: (id: string) => Promise<void>
    deleteFiles?: (
      paths: string | string[] | null | undefined
    ) => Promise<{ deletedPaths: string[] }>
  }
): Promise<{
  deletedId: string
  deletedSlug: string
  deletedStoragePaths: string[]
}> {
  const getExistingFn = deps?.getExistingProduct ?? getProductByIdWithRelations
  const deleteRowFn = deps?.deleteProductRow ?? deleteProductRowById
  const deleteStorageFn = deps?.deleteFiles ?? deleteProductStorageFilesServer

  const existing = await getExistingFn(id)
  if (!existing) {
    throw new Error('El producto a eliminar no existe.')
  }

  const storagePaths = existing.images
    .map((img) => img.storage_path)
    .filter((p): p is string => Boolean(p && p.trim()))

  if (storagePaths.length > 0) {
    await deleteStorageFn(storagePaths)
  }

  await deleteRowFn(id)

  return {
    deletedId: id,
    deletedSlug: existing.slug,
    deletedStoragePaths: storagePaths,
  }
}

export interface PublicCatalogFilterOptions {
  q?: string
  categoria?: string
  subcategoria?: string
  minPrice?: number
  maxPrice?: number
  orden?: 'recientes' | 'precio_asc' | 'precio_desc' | string
  enStock?: boolean
}

/**
 * Pure filter and sort function for public catalog items.
 */
export function filterAndSortPublicCatalog(
  products: ProductWithRelations[],
  filters: PublicCatalogFilterOptions
): ProductWithRelations[] {
  const query = (filters.q ?? '').trim().toLowerCase()
  const catSlug = (filters.categoria ?? '').trim().toLowerCase()
  const subcatSlug = (filters.subcategoria ?? '').trim().toLowerCase()
  const minPrice =
    typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)
      ? filters.minPrice
      : undefined
  const maxPrice =
    typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)
      ? filters.maxPrice
      : undefined
  const enStockOnly = Boolean(filters.enStock)

  const filtered = products.filter((p) => {
    // 1. Query search
    if (query) {
      const matchName = p.name.toLowerCase().includes(query)
      const matchDesc = p.description?.toLowerCase().includes(query) ?? false
      const matchSku =
        p.variants?.some((v) => v.sku?.toLowerCase().includes(query)) ?? false
      const matchCategory = p.category?.name.toLowerCase().includes(query) ?? false
      if (!matchName && !matchDesc && !matchSku && !matchCategory) {
        return false
      }
    }

    // 2. Category / Subcategory
    if (subcatSlug) {
      if (p.category?.slug.toLowerCase() !== subcatSlug) return false
    } else if (catSlug) {
      const matchesCat = p.category?.slug.toLowerCase() === catSlug
      if (!matchesCat) return false
    }

    // 3. Price filter
    if (minPrice !== undefined && p.base_price < minPrice) {
      return false
    }
    if (maxPrice !== undefined && p.base_price > maxPrice) {
      return false
    }

    // 4. Stock filter
    if (enStockOnly) {
      const totalStock = (p.variants ?? []).reduce(
        (sum, v) => sum + Math.max(0, Number(v.stock_quantity ?? 0)),
        0
      )
      if (totalStock <= 0) {
        return false
      }
    }

    return true
  })

  // 5. Sorting
  const orden = filters.orden ?? 'recientes'
  return filtered.sort((a, b) => {
    if (orden === 'precio_asc') {
      return a.base_price - b.base_price
    }
    if (orden === 'precio_desc') {
      return b.base_price - a.base_price
    }
    // Default: 'recientes'
    return b.created_at.localeCompare(a.created_at)
  })
}

/**
 * Service to retrieve active public catalog products with relations.
 */
export async function getPublicCatalogService(deps?: {
  fetchActiveProducts?: () => Promise<ProductWithRelations[]>
}): Promise<ProductWithRelations[]> {
  const fetchFn = deps?.fetchActiveProducts ?? listActiveProductsWithRelations
  return fetchFn()
}

