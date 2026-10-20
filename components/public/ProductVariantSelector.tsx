'use client'

import { useState } from 'react'
import type { ProductVariantRow } from '@/types/database.types'
import {
  resolveEffectivePrice,
  resolveVariantAvailability,
} from '@/utils/product-badges'
import { formatCurrency, buildProductWhatsAppUrl } from '@/utils/formatters'
import { MessageCircle, Check, ArrowRight, ShieldCheck, MapPin, Store } from 'lucide-react'

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
      {/* Encabezado de Precio Editorial Kith */}
      <div className="space-y-1.5 border-b border-black pb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
            {formatCurrency(effectivePrice)}
          </span>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base text-zinc-400 line-through font-normal">
                {formatCurrency(compareAtPrice)}
              </span>
              <span className="bg-black text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
                -{discountPercent}% OFF
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
          Precio final de mostrador • Pagos en efectivo, transferencia o tarjeta
        </p>
      </div>

      {/* Selector de Variantes estilo Kith Chips */}
      {activeVariants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-[0.2em] uppercase text-zinc-400 text-[10px]">
              Seleccionar Opción / Variante
            </span>
            {selectedVariant && (
              <span
                className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                  availability.status === 'out_of_stock'
                    ? 'text-zinc-400 line-through'
                    : availability.status === 'low_stock'
                    ? 'text-amber-600'
                    : 'text-zinc-900'
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
                  className={`relative p-3 text-left transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-xs'
                      : isOutOfStock
                      ? 'border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed opacity-50'
                      : 'border-zinc-300 bg-white text-zinc-900 hover:border-black'
                  }`}
                >
                  <div className="flex items-start justify-between w-full gap-1">
                    <span className="font-bold text-xs uppercase tracking-tight line-clamp-1">
                      {variant.name}
                    </span>
                    {isSelected && <Check className="size-3.5 shrink-0 stroke-[2.5]" />}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between w-full text-[11px] font-mono">
                    <span className={isSelected ? 'text-zinc-200' : 'text-zinc-500'}>
                      {formatCurrency(variantPrice)}
                    </span>
                    {variant.size && (
                      <span className={`text-[10px] uppercase ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {variant.size}
                      </span>
                    )}
                  </div>

                  {isOutOfStock && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1 block">
                      Agotado
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Primario estilo Botón Kith Monocromático */}
      <div className="space-y-3 pt-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-4 px-6 inline-flex items-center justify-center gap-3 text-xs sm:text-sm font-black tracking-[0.2em] uppercase transition-all duration-300 ${
              availability.status === 'out_of_stock'
                ? 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300 cursor-not-allowed'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            <MessageCircle className="size-4.5 stroke-[2]" />
            <span>
              {availability.status === 'out_of_stock'
                ? 'Consultar Reposición por WhatsApp'
                : 'Pedir por WhatsApp'}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}

        <p className="text-center text-[10px] font-mono tracking-widest uppercase text-zinc-400">
          Respuesta inmediata • Atención personalizada sin intermediarios
        </p>
      </div>

      {/* Grid de Beneficios Editorial Kith */}
      <div className="border-t border-black pt-4 grid grid-cols-3 gap-3 text-center">
        <div className="p-3 border border-black/10 bg-[#fafafa] flex flex-col items-center justify-center gap-1">
          <MapPin className="size-4 text-zinc-900 stroke-[1.5]" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-900">
            Retiro en Local
          </span>
          <span className="text-[9px] text-zinc-400 uppercase">
            Disponibilidad hoy
          </span>
        </div>
        <div className="p-3 border border-black/10 bg-[#fafafa] flex flex-col items-center justify-center gap-1">
          <Store className="size-4 text-zinc-900 stroke-[1.5]" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-900">
            Venta en Local
          </span>
          <span className="text-[9px] text-zinc-400 uppercase">
            Sin envíos
          </span>
        </div>
        <div className="p-3 border border-black/10 bg-[#fafafa] flex flex-col items-center justify-center gap-1">
          <ShieldCheck className="size-4 text-zinc-900 stroke-[1.5]" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-900">
            Calidad Testeada
          </span>
          <span className="text-[9px] text-zinc-400 uppercase">
            Revisión 100%
          </span>
        </div>
      </div>
    </div>
  )
}
