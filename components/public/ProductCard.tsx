import Link from 'next/link'
import Image from 'next/image'
import type { ShowcaseProductItem } from '@/types/database.types'
import { formatCurrency } from '@/utils/formatters'
import { Package } from 'lucide-react'

interface ProductCardProps {
  product: ShowcaseProductItem
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.total_stock <= 0
  const isLowStock = !isOutOfStock && product.total_stock <= (product.min_stock_alert || 3)
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.base_price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.base_price) / product.compare_at_price!) * 100)
    : 0

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs transition overflow-hidden"
    >
      <div className="relative aspect-square w-full bg-zinc-50 overflow-hidden">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
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

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {hasDiscount && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-md">
              -{discountPercent}% OFF
            </span>
          )}
          {product.is_featured && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-900 text-white rounded-md">
              Destacado
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2">
          {isOutOfStock ? (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-300 rounded-md">
              Sin stock
            </span>
          ) : isLowStock ? (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-600 text-white rounded-md animate-pulse">
              Últimas {product.total_stock}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          {product.category_name && (
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-0.5">
              {product.category_name}
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
