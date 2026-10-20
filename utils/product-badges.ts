export type ProductBadgeType =
  | 'new'
  | 'discount'
  | 'low_stock'
  | 'out_of_stock'
  | 'featured'

export interface ProductBadge {
  type: ProductBadgeType
  label: string
  discountPercent?: number
  className: string
}

export interface ProductBadgeInput {
  base_price: number
  compare_at_price?: number | null
  total_stock?: number
  min_stock_alert?: number
  created_at?: string
  is_featured?: boolean
}

export interface VariantAvailability {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  label: string
  isAvailable: boolean
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Computes deterministic badges for product cards and details:
 * - "Nuevo": product was created within 7 days.
 * - "-X% OFF": when compare_at_price > base_price.
 * - "Sin stock": when total_stock is <= 0.
 * - "Últimas X unidades": when 0 < total_stock <= min_stock_alert.
 * - "Destacado": when product is flagged as featured.
 */
export function computeProductBadges(
  input: ProductBadgeInput,
  referenceDate: Date = new Date()
): ProductBadge[] {
  const badges: ProductBadge[] = []

  // 1. Discount Badge (% OFF)
  if (
    input.compare_at_price &&
    input.compare_at_price > input.base_price &&
    input.base_price > 0
  ) {
    const discount = Math.round(
      ((input.compare_at_price - input.base_price) / input.compare_at_price) * 100
    )
    if (discount > 0) {
      badges.push({
        type: 'discount',
        label: `-${discount}% OFF`,
        discountPercent: discount,
        className: 'bg-amber-500 text-white font-bold',
      })
    }
  }

  // 2. New Badge
  if (input.created_at) {
    const createdTime = new Date(input.created_at).getTime()
    if (!Number.isNaN(createdTime)) {
      const nowTime = referenceDate.getTime()
      if (nowTime - createdTime <= SEVEN_DAYS_MS && nowTime >= createdTime) {
        badges.push({
          type: 'new',
          label: 'Nuevo',
          className: 'bg-emerald-600 text-white font-medium',
        })
      }
    }
  }

  // 3. Featured Badge
  if (input.is_featured) {
    badges.push({
      type: 'featured',
      label: 'Destacado',
      className: 'bg-zinc-900 text-white font-semibold',
    })
  }

  // 4. Stock status
  if (input.total_stock !== undefined) {
    const stock = Number(input.total_stock)
    const threshold = input.min_stock_alert ?? 3
    if (stock <= 0) {
      badges.push({
        type: 'out_of_stock',
        label: 'Sin stock',
        className: 'bg-zinc-800 text-zinc-300 font-medium',
      })
    } else if (stock <= threshold) {
      badges.push({
        type: 'low_stock',
        label: `Últimas ${stock} unidades`,
        className: 'bg-rose-600 text-white font-semibold animate-pulse',
      })
    }
  }

  return badges
}

/**
 * Returns the effective price taking into account variant price overrides.
 */
export function resolveEffectivePrice(
  basePrice: number,
  variant?: { price_override?: number | null } | null
): number {
  if (
    variant &&
    variant.price_override !== null &&
    variant.price_override !== undefined &&
    !Number.isNaN(Number(variant.price_override))
  ) {
    return Number(variant.price_override)
  }
  return basePrice
}

/**
 * Computes availability status and user-facing text for a variant.
 */
export function resolveVariantAvailability(
  variant?: { stock_quantity?: number | null; min_stock_alert?: number | null } | null
): VariantAvailability {
  const stock = Math.max(0, Number(variant?.stock_quantity ?? 0))
  const minAlert = Math.max(1, Number(variant?.min_stock_alert ?? 3))

  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Agotado',
      isAvailable: false,
    }
  }

  if (stock <= minAlert) {
    return {
      status: 'low_stock',
      label: `Últimas ${stock} unidades`,
      isAvailable: true,
    }
  }

  return {
    status: 'in_stock',
    label: 'Disponible',
    isAvailable: true,
  }
}
