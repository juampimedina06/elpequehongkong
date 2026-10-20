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
  let secondaryImageUrl: string | null = null
  let totalStock = 0
  let minStockAlert = 3
  let categoryName: string | null = null

  if (isProductWithRelations(product)) {
    const sortedImages = [...(product.images ?? [])].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })
    primaryImageUrl = sortedImages[0]?.url ?? null
    secondaryImageUrl = sortedImages[1]?.url ?? null

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
    primaryImageUrl =
      product.primary_image_url ||
      (product as unknown as { images?: Array<{ url: string }> }).images?.[0]?.url ||
      null
    secondaryImageUrl =
      product.secondary_image_url ||
      (product as unknown as { images?: Array<{ url: string }> }).images?.[1]?.url ||
      null
    totalStock = Number(product.total_stock ?? 0)
    minStockAlert = Number(product.min_stock_alert ?? 3)
    categoryName =
      product.category_name ||
      (product as unknown as { category?: { name: string } }).category?.name ||
      null
  }

  primaryImageUrl = primaryImageUrl?.trim() || null
  secondaryImageUrl = secondaryImageUrl?.trim() || null


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
      className="group flex flex-col justify-between bg-transparent transition-all"
    >
      {/* Contenedor de Imagen con Proporción Editorial 3:4 */}
      <div className="relative aspect-[3/4] w-full bg-[#f5f5f5] overflow-hidden">
        {primaryImageUrl ? (
          <>
            <Image
              src={primaryImageUrl}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ease-out ${
                secondaryImageUrl
                  ? 'group-hover:opacity-0'
                  : 'group-hover:scale-105'
              }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondaryImageUrl && (
              <Image
                src={secondaryImageUrl}
                alt={`${product.name} foto secundaria`}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 group-hover:scale-103 transition-all duration-700 ease-out"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-300">
            <Package className="size-10 stroke-[1.2]" />
          </div>
        )}

        {/* Badges Minimalistas Kith (Esquina Superior Izquierda) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10">
          {discountBadge && (
            <span className="bg-black text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
              {discountBadge.label}
            </span>
          )}
          {newBadge && !discountBadge && (
            <span className="bg-white text-black border border-black/20 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
              Nuevo
            </span>
          )}
          {stockBadge && (
            <span className="bg-zinc-900/90 backdrop-blur-xs text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
              {stockBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Información del Producto Tipografía Kith */}
      <div className="pt-3 pb-1 space-y-1">
        {categoryName && (
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 block">
            {categoryName}
          </span>
        )}

        <h3 className="font-semibold text-xs sm:text-sm text-zinc-900 tracking-tight leading-snug line-clamp-1 group-hover:underline underline-offset-4 decoration-zinc-900/60">
          {product.name}
        </h3>

        <div className="pt-1 flex items-baseline gap-2">
          <span className="text-xs sm:text-sm font-bold text-zinc-900 tracking-tight">
            {formatCurrency(product.base_price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-zinc-400 line-through font-normal">
              {formatCurrency(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
