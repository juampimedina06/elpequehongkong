'use client'

import { useState } from 'react'
import type { ProductVariantRow } from '@/types/database.types'
import {
  resolveEffectivePrice,
  resolveVariantAvailability,
} from '@/utils/product-badges'
import { formatCurrency, buildProductWhatsAppUrl } from '@/utils/formatters'
import { MessageCircle, Check, AlertCircle } from 'lucide-react'

interface ProductVariantSelectorProps {
  productName: string
  productSlug: string
  basePrice: number
  compareAtPrice?: number | null
  variants: ProductVariantRow[]
  onVariantSelect?: (variant: ProductVariantRow) => void
}

export function ProductVariantSelector({
  productName,
  productSlug,
  basePrice,
  compareAtPrice,
  variants,
  onVariantSelect,
}: ProductVariantSelectorProps) {
  const activeVariants = variants.filter((v) => v.is_active !== false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantRow | null>(
    activeVariants[0] ?? null
  )

  const handleSelect = (variant: ProductVariantRow) => {
    setSelectedVariant(variant)
    onVariantSelect?.(variant)
  }

  const effectivePrice = resolveEffectivePrice(basePrice, selectedVariant)
  const availability = resolveVariantAvailability(selectedVariant)

  const hasDiscount =
    compareAtPrice !== null &&
    compareAtPrice !== undefined &&
    compareAtPrice > effectivePrice

  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - effectivePrice) / compareAtPrice) * 100)
    : 0

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/producto/${productSlug}`
      : `/producto/${productSlug}`

  const whatsappUrl = buildProductWhatsAppUrl({
    productName,
    variantLabel: selectedVariant ? selectedVariant.name : null,
    sku: selectedVariant?.sku,
    productUrl,
  })

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            {formatCurrency(effectivePrice)}
          </span>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400 line-through">
                {formatCurrency(compareAtPrice)}
              </span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                -{discountPercent}% OFF
              </span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-zinc-400">
          Precio final para retiro en tienda o envío particular.
        </p>
      </div>

      {/* Variants List */}
      {activeVariants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Variante / Opción
            </span>
            {selectedVariant && (
              <span
                className={`text-xs font-medium ${
                  availability.status === 'out_of_stock'
                    ? 'text-zinc-500'
                    : availability.status === 'low_stock'
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {availability.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeVariants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id
              const isOutOfStock = (variant.stock_quantity ?? 0) <= 0
              const variantPrice = resolveEffectivePrice(basePrice, variant)

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleSelect(variant)}
                  className={`relative flex flex-col p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                      : isOutOfStock
                      ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed opacity-60'
                      : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs line-clamp-1">
                      {variant.name}
                    </span>
                    {isSelected && <Check className="size-3.5 shrink-0" />}
                  </div>

                  <div className="mt-1 flex items-baseline gap-1 text-[11px]">
                    <span
                      className={isSelected ? 'text-zinc-300' : 'text-zinc-500'}
                    >
                      {formatCurrency(variantPrice)}
                    </span>
                    {variant.size && (
                      <span className="text-[10px] opacity-75">
                        • {variant.size}
                      </span>
                    )}
                  </div>

                  {isOutOfStock && (
                    <span className="text-[9px] text-zinc-400 font-medium uppercase mt-0.5">
                      Agotado
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Availability Notice */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 text-xs text-zinc-600 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-zinc-900">
          <AlertCircle className="size-4 text-zinc-500" />
          <span>Disponibilidad en Tiempo Real</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Los artículos no se reservan en carrito digital. Coordinamos ventas directas en mostrador o confirmación de stock antes del envío.
        </p>
      </div>

      {/* WhatsApp CTA Button */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition shadow-xs ${
            availability.status === 'out_of_stock'
              ? 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <MessageCircle className="size-4" />
          <span>
            {availability.status === 'out_of_stock'
              ? 'Consultar reposición por WhatsApp'
              : 'Consultar por este producto'}
          </span>
        </a>
      )}
    </div>
  )
}
