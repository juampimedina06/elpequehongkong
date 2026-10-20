'use client'

import { useState } from 'react'
import type { ProductWithRelations, ProductVariantRow } from '@/types/database.types'
import { ProductGallery } from '@/components/public/ProductGallery'
import { ProductVariantSelector } from '@/components/public/ProductVariantSelector'
import { computeProductBadges } from '@/utils/product-badges'
import Link from 'next/link'
import { ChevronRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react'

interface ProductDetailViewProps {
  product: ProductWithRelations
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [activeImageId, setActiveImageId] = useState<string | null>(null)

  const activeVariants = (product.variants ?? []).filter(
    (v) => v.is_active !== false
  )
  const totalStock = activeVariants.reduce(
    (sum, v) => sum + Math.max(0, Number(v.stock_quantity ?? 0)),
    0
  )
  const minStockAlert =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => Math.max(1, Number(v.min_stock_alert ?? 3))))
      : 3

  const badges = computeProductBadges({
    base_price: product.base_price,
    compare_at_price: product.compare_at_price,
    total_stock: totalStock,
    min_stock_alert: minStockAlert,
    created_at: product.created_at,
    is_featured: product.is_featured,
  })

  const handleVariantSelect = (variant: ProductVariantRow) => {
    // If variant has an image linked, find its image id
    if (variant.image_id) {
      setActiveImageId(variant.image_id)
    } else {
      const matchingImg = product.images.find(
        (img) => img.variant_id === variant.id
      )
      if (matchingImg) {
        setActiveImageId(matchingImg.id)
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap pb-1"
      >
        <Link href="/" className="hover:text-zinc-700 transition">
          Inicio
        </Link>
        <ChevronRight className="size-3 shrink-0" />
        <Link href="/catalogo" className="hover:text-zinc-700 transition">
          Catálogo
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3 shrink-0" />
            <Link
              href={`/catalogo?categoria=${product.category.slug}`}
              className="hover:text-zinc-700 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3 shrink-0" />
        <span className="text-zinc-700 font-medium truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Grid: Gallery + Variant & Purchase Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Gallery with Zoom */}
        <div>
          <ProductGallery
            images={product.images}
            activeImageId={activeImageId}
          />
        </div>

        {/* Right: Product Details & Variant Selection */}
        <div className="space-y-6">
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              {product.category && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {product.category.name}
                </span>
              )}
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 text-[10px] rounded-md ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Interactive Variant Selector & WhatsApp CTA */}
          <ProductVariantSelector
            productName={product.name}
            productSlug={product.slug}
            basePrice={product.base_price}
            compareAtPrice={product.compare_at_price}
            variants={product.variants}
            onVariantSelect={handleVariantSelect}
          />

          {/* Store Benefits */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-zinc-50">
              <ShieldCheck className="size-4 text-zinc-700" />
              <span className="font-medium text-zinc-900">Garantía Real</span>
              <span className="text-[10px] text-zinc-400">Control de calidad</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-zinc-50">
              <Truck className="size-4 text-zinc-700" />
              <span className="font-medium text-zinc-900">Retiro Inmediato</span>
              <span className="text-[10px] text-zinc-400">O envío a convenir</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-2 rounded-xl bg-zinc-50">
              <RotateCcw className="size-4 text-zinc-700" />
              <span className="font-medium text-zinc-900">Atención Directa</span>
              <span className="text-[10px] text-zinc-400">Sin intermediarios</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {product.description && (
        <div className="pt-8 border-t border-zinc-200/80 space-y-3 max-w-3xl">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-900">
            Descripción y Especificaciones
          </h2>
          <div className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}
    </div>
  )
}
