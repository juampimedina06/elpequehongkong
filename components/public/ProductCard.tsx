import Link from 'next/link'
import Image from 'next/image'
import type { ProductWithRelations, ShowcaseProductItem } from '@/types/database.types'
import { formatCurrency } from '@/utils/formatters'
import { computeProductBadges } from '@/utils/product-badges'
import { Package } from 'lucide-react'

export interface ProductCardProps {
  product: ShowcaseProductItem | ProductWithRelations
}

function isProductWithRelations(
  p: ShowcaseProductItem | ProductWithRelations
): p is ProductWithRelations {
  return 'variants' in p && Array.isArray((p as ProductWithRelations).variants)
}

export function ProductCard({ product }: ProductCardProps) {
  let primaryImageUrl: string | null = null
  let totalStock = 0
  let minStockAlert = 3
  let categoryName: string | null = null

  if (isProductWithRelations(product)) {
    const sortedImages = [...(product.images ?? [])].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })
    primaryImageUrl = sortedImages[0]?.url ?? null

    const activeVariants = (product.variants ?? []).filter(
      (v) => v.is_active !== false
    )
    totalStock = activeVariants.reduce(
      (sum, v) => sum + Math.max(0, Number(v.stock_quantity ?? 0)),
      0
    )
    minStockAlert =
      activeVariants.length > 0
        ? Math.min(...activeVariants.map((v) => Math.max(1, Number(v.min_stock_alert ?? 3))))
        : 3
    categoryName = product.category?.name ?? null
  } else {
    primaryImageUrl = product.primary_image_url
    totalStock = product.total_stock
    minStockAlert = product.min_stock_alert
    categoryName = product.category_name
  }

  const badges = computeProductBadges({
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    total_stock: totalStock,
    min_stock_alert: minStockAlert,
    created_at: product.created_at,
    is_featured: product.is_featured,
  })

  const discountBadge = badges.find((b) => b.type === 'discount')
  const newBadge = badges.find((b) => b.type === 'new')
  const featuredBadge = badges.find((b) => b.type === 'featured')
  const stockBadge = badges.find(
    (b) => b.type === 'out_of_stock' || b.type === 'low_stock'
  )

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.base_price

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs transition overflow-hidden"
    >
      <div className="relative aspect-square w-full bg-zinc-50 overflow-hidden">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-102 transition duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-300">
            <Package className="size-10" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {discountBadge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-md ${discountBadge.className}`}
            >
              {discountBadge.label}
            </span>
          )}
          {newBadge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-md ${newBadge.className}`}
            >
              {newBadge.label}
            </span>
          )}
          {featuredBadge && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-md ${featuredBadge.className}`}
            >
              {featuredBadge.label}
            </span>
          )}
        </div>

        {/* Bottom Stock Badge */}
        {stockBadge && (
          <div className="absolute bottom-2 right-2">
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-md ${stockBadge.className}`}
            >
              {stockBadge.label}
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          {categoryName && (
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-0.5">
              {categoryName}
            </span>
          )}
          <h3 className="font-semibold text-xs text-zinc-900 line-clamp-2 leading-snug group-hover:text-zinc-700 transition">
            {product.name}
          </h3>
        </div>

        <div className="pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-zinc-900">
              {formatCurrency(product.base_price)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-zinc-400 line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
