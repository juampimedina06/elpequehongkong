import { createClient } from '@/lib/supabase/server'
import type { ProductStatus, SystemStorageStats } from '@/types/database.types'

export const FREE_TIER_DB_LIMIT_BYTES = 524_288_000 as const // 500 MB
export const FREE_TIER_STORAGE_LIMIT_BYTES = 1_073_741_824 as const // 1 GB
export const FREE_TIER_EGRESS_LIMIT_BYTES = 5_368_709_120 as const // 5 GB
export const FREE_TIER_MAU_LIMIT = 50_000 as const // 50,000 MAU

export const ESTIMATED_AVG_WEBP_BYTES = 85 * 1024 // ~85 KB per compressed WebP
export const ESTIMATED_BASE_DB_BYTES = 8 * 1024 * 1024 // ~8 MB Postgres base system tables
export const ESTIMATED_BYTES_PER_ROW = 2048 // ~2 KB per catalog record + indexes

export type TrafficLightColor = 'emerald' | 'amber' | 'red'

export interface ResourceUsageMetric {
  usedBytes: number
  limitBytes: number
  percentage: number
  color: TrafficLightColor
  barClassName: string
}

export interface LowStockAlertItem {
  variantId: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string | null
  stockQuantity: number
  minStockAlert: number
  effectivePrice: number
}

export interface DashboardVariantWithProduct {
  id: string
  product_id: string
  name: string
  sku: string | null
  stock_quantity: number
  min_stock_alert: number
  price_override: number | null
  is_active: boolean
  product: {
    id: string
    name: string
    slug: string
    base_price: number
    status: ProductStatus
  } | null
}

export interface DashboardMetrics {
  storage: {
    db: ResourceUsageMetric
    media: ResourceUsageMetric & { totalFilesCount: number }
    egressLimitBytes: number
    mauLimit: number
    isFallback: boolean
  }
  kpis: {
    activeProductsCount: number
    totalStockValuation: number
    lowStockCount: number
  }
  lowStockAlerts: LowStockAlertItem[]
}

export interface FallbackStorageCounts {
  productImagesCount: number
  categoriesWithImagesCount: number
  bannersCount: number
  productsCount: number
  variantsCount: number
}

export interface DashboardServiceDependencies {
  fetchStorageStatsRpc?: () => Promise<{
    data: Partial<SystemStorageStats> | null
    error: { message: string } | null
  }>
  fetchFallbackCounts?: () => Promise<FallbackStorageCounts>
  fetchActiveProductsCount?: () => Promise<number>
  fetchVariantsWithProducts?: () => Promise<DashboardVariantWithProduct[]>
}

/**
 * Resolves the traffic-light color based on Free Tier usage percentage:
 * - < 70%: emerald
 * - 70% - 90%: amber
 * - > 90%: red
 */
export function resolveTrafficLightColor(percentage: number): TrafficLightColor {
  if (percentage > 90) return 'red'
  if (percentage >= 70) return 'amber'
  return 'emerald'
}

/**
 * Returns the exact Tailwind CSS background class for the traffic-light progress bar.
 */
export function resolveTrafficLightClassName(color: TrafficLightColor): string {
  switch (color) {
    case 'red':
      return 'bg-red-600'
    case 'amber':
      return 'bg-amber-500'
    case 'emerald':
    default:
      return 'bg-emerald-500'
  }
}

/**
 * Computes percentage, traffic-light color, and bar class for a byte quota metric.
 */
export function computeResourceUsageMetric(
  usedBytes: number,
  limitBytes: number
): ResourceUsageMetric {
  const safeUsed = Math.max(0, Number.isFinite(usedBytes) ? usedBytes : 0)
  const safeLimit = Math.max(1, Number.isFinite(limitBytes) ? limitBytes : 1)
  const rawPercentage = (safeUsed / safeLimit) * 100
  const percentage = Math.min(100, Number(rawPercentage.toFixed(1)))
  const color = resolveTrafficLightColor(percentage)

  return {
    usedBytes: safeUsed,
    limitBytes: safeLimit,
    percentage,
    color,
    barClassName: resolveTrafficLightClassName(color),
  }
}

/**
 * Calculates total inventory valuation across active variants:
 * SUM(stock_quantity * COALESCE(price_override, product.base_price))
 */
export function calculateInventoryValuation(
  variants: DashboardVariantWithProduct[]
): number {
  let total = 0

  for (const variant of variants) {
    if (!variant.is_active) continue
    if (variant.product && variant.product.status !== 'active') continue

    const stock = Math.max(0, variant.stock_quantity)
    const effectivePrice =
      variant.price_override !== null && variant.price_override !== undefined
        ? Number(variant.price_override)
        : Number(variant.product?.base_price ?? 0)

    if (stock > 0 && effectivePrice > 0) {
      total += stock * effectivePrice
    }
  }

  return Math.round(total * 100) / 100
}

/**
 * Extracts active variants whose stock_quantity <= min_stock_alert,
 * sorted by lowest stock first.
 */
export function extractLowStockAlerts(
  variants: DashboardVariantWithProduct[]
): LowStockAlertItem[] {
  const alerts: LowStockAlertItem[] = []

  for (const variant of variants) {
    if (!variant.is_active) continue
    if (!variant.product || variant.product.status === 'archived') continue

    if (variant.stock_quantity <= variant.min_stock_alert) {
      const effectivePrice =
        variant.price_override !== null && variant.price_override !== undefined
          ? Number(variant.price_override)
          : Number(variant.product.base_price)

      alerts.push({
        variantId: variant.id,
        productId: variant.product_id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantName: variant.name,
        sku: variant.sku,
        stockQuantity: variant.stock_quantity,
        minStockAlert: variant.min_stock_alert,
        effectivePrice,
      })
    }
  }

  return alerts.sort((a, b) => a.stockQuantity - b.stockQuantity)
}

async function defaultFetchStorageStatsRpc(): Promise<{
  data: Partial<SystemStorageStats> | null
  error: { message: string } | null
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_system_storage_stats')
    if (error) {
      return { data: null, error: { message: error.message } }
    }
    return { data: (data as Partial<SystemStorageStats>) ?? null, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Error al consultar RPC',
      },
    }
  }
}

async function defaultFetchFallbackCounts(): Promise<FallbackStorageCounts> {
  try {
    const supabase = await createClient()
    const [imagesRes, categoriesRes, bannersRes, productsRes, variantsRes] =
      await Promise.all([
        supabase
          .from('product_images')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .not('storage_path', 'is', null),
        supabase
          .from('home_banners')
          .select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase
          .from('product_variants')
          .select('id', { count: 'exact', head: true }),
      ])

    return {
      productImagesCount: imagesRes.count ?? 0,
      categoriesWithImagesCount: categoriesRes.count ?? 0,
      bannersCount: bannersRes.count ?? 0,
      productsCount: productsRes.count ?? 0,
      variantsCount: variantsRes.count ?? 0,
    }
  } catch {
    return {
      productImagesCount: 0,
      categoriesWithImagesCount: 0,
      bannersCount: 0,
      productsCount: 0,
      variantsCount: 0,
    }
  }
}

async function defaultFetchActiveProductsCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function defaultFetchVariantsWithProducts(): Promise<
  DashboardVariantWithProduct[]
> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_variants')
      .select(
        `
        id,
        product_id,
        name,
        sku,
        stock_quantity,
        min_stock_alert,
        price_override,
        is_active,
        product:products (
          id,
          name,
          slug,
          base_price,
          status
        )
      `
      )
      .eq('is_active', true)

    if (error || !data) return []

    return (data as unknown as Array<{
      id: string
      product_id: string
      name: string
      sku: string | null
      stock_quantity: number
      min_stock_alert: number
      price_override: number | null
      is_active: boolean
      product:
        | {
            id: string
            name: string
            slug: string
            base_price: number
            status: ProductStatus
          }
        | Array<{
            id: string
            name: string
            slug: string
            base_price: number
            status: ProductStatus
          }>
        | null
    }>).map((row) => {
      const normalizedProduct = Array.isArray(row.product)
        ? row.product[0] ?? null
        : row.product ?? null
      return {
        id: row.id,
        product_id: row.product_id,
        name: row.name,
        sku: row.sku,
        stock_quantity: Number(row.stock_quantity ?? 0),
        min_stock_alert: Number(row.min_stock_alert ?? 0),
        price_override:
          row.price_override !== null && row.price_override !== undefined
            ? Number(row.price_override)
            : null,
        is_active: Boolean(row.is_active),
        product: normalizedProduct
          ? {
              id: normalizedProduct.id,
              name: normalizedProduct.name,
              slug: normalizedProduct.slug,
              base_price: Number(normalizedProduct.base_price ?? 0),
              status: normalizedProduct.status,
            }
          : null,
      }
    })
  } catch {
    return []
  }
}

/**
 * Fetches Free Tier storage metrics and inventory KPIs in parallel via Promise.all.
 * Transparently falls back to table/image count estimation if `get_system_storage_stats()`
 * is not deployed or returns an error.
 */
export async function getDashboardMetrics(
  deps?: DashboardServiceDependencies
): Promise<DashboardMetrics> {
  const fetchStorageStatsRpc =
    deps?.fetchStorageStatsRpc ?? defaultFetchStorageStatsRpc
  const fetchFallbackCounts =
    deps?.fetchFallbackCounts ?? defaultFetchFallbackCounts
  const fetchActiveProductsCount =
    deps?.fetchActiveProductsCount ?? defaultFetchActiveProductsCount
  const fetchVariantsWithProducts =
    deps?.fetchVariantsWithProducts ?? defaultFetchVariantsWithProducts

  const [rpcResult, activeProductsCount, variants] = await Promise.all([
    fetchStorageStatsRpc(),
    fetchActiveProductsCount(),
    fetchVariantsWithProducts(),
  ])

  let dbUsedBytes = 0
  let dbLimitBytes: number = FREE_TIER_DB_LIMIT_BYTES
  let storageUsedBytes = 0
  let storageLimitBytes: number = FREE_TIER_STORAGE_LIMIT_BYTES
  let totalFilesCount = 0
  let egressLimitBytes: number = FREE_TIER_EGRESS_LIMIT_BYTES
  let mauLimit: number = FREE_TIER_MAU_LIMIT
  let isFallback = false

  if (
    !rpcResult.error &&
    rpcResult.data &&
    typeof rpcResult.data.db_size_bytes === 'number'
  ) {
    dbUsedBytes = rpcResult.data.db_size_bytes
    dbLimitBytes = rpcResult.data.db_limit_bytes ?? FREE_TIER_DB_LIMIT_BYTES
    storageUsedBytes = rpcResult.data.storage_size_bytes ?? 0
    storageLimitBytes =
      rpcResult.data.storage_limit_bytes ?? FREE_TIER_STORAGE_LIMIT_BYTES
    totalFilesCount = rpcResult.data.total_files_count ?? 0
    egressLimitBytes =
      rpcResult.data.egress_limit_bytes ?? FREE_TIER_EGRESS_LIMIT_BYTES
    mauLimit = rpcResult.data.mau_limit ?? FREE_TIER_MAU_LIMIT
  } else {
    isFallback = true
    const counts = await fetchFallbackCounts()
    totalFilesCount =
      counts.productImagesCount +
      counts.categoriesWithImagesCount +
      counts.bannersCount
    storageUsedBytes = totalFilesCount * ESTIMATED_AVG_WEBP_BYTES
    const totalRows =
      counts.productsCount +
      counts.variantsCount +
      totalFilesCount
    dbUsedBytes = ESTIMATED_BASE_DB_BYTES + totalRows * ESTIMATED_BYTES_PER_ROW
  }

  const dbMetric = computeResourceUsageMetric(dbUsedBytes, dbLimitBytes)
  const mediaMetric = computeResourceUsageMetric(
    storageUsedBytes,
    storageLimitBytes
  )

  const totalStockValuation = calculateInventoryValuation(variants)
  const lowStockAlerts = extractLowStockAlerts(variants)

  return {
    storage: {
      db: dbMetric,
      media: {
        ...mediaMetric,
        totalFilesCount,
      },
      egressLimitBytes,
      mauLimit,
      isFallback,
    },
    kpis: {
      activeProductsCount,
      totalStockValuation,
      lowStockCount: lowStockAlerts.length,
    },
    lowStockAlerts,
  }
}

export const getDashboardData = getDashboardMetrics
