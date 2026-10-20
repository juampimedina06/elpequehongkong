'use client'

import { useState } from 'react'
import type { ProductWithRelations, ProductVariantRow } from '@/types/database.types'
import { ProductGallery } from '@/components/public/ProductGallery'
import { ProductVariantSelector } from '@/components/public/ProductVariantSelector'
import { computeProductBadges } from '@/utils/product-badges'
import { formatCurrency, buildProductWhatsAppUrl } from '@/utils/formatters'
import Link from 'next/link'
import { ChevronDown, MessageCircle } from 'lucide-react'

interface ProductDetailViewProps {
  product: ProductWithRelations
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  const [openAccordion, setOpenAccordion] = useState<string | null>('detalles')

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

  const discountBadge = badges.find((b) => b.type === 'discount')
  const newBadge = badges.find((b) => b.type === 'new')
  const stockBadge = badges.find(
    (b) => b.type === 'out_of_stock' || b.type === 'low_stock'
  )

  const handleVariantSelect = (variant: ProductVariantRow) => {
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

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => (prev === section ? null : section))
  }

  const productUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/producto/${product.slug}`
      : `/producto/${product.slug}`

  const quickWhatsappUrl = buildProductWhatsAppUrl({
    productName: product.name,
    productUrl,
  })

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Navegación Breadcrumb Estilo Editorial Kith */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400 overflow-x-auto whitespace-nowrap pb-2 border-b border-black/10"
      >
        <Link href="/" className="hover:text-black transition">
          Inicio
        </Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-black transition">
          Catálogo
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/catalogo?categoria=${product.category.slug}`}
              className="hover:text-black transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-950 truncate max-w-xs font-black">
          {product.name}
        </span>
      </nav>

      {/* Grid Principal Editorial 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Columna Izquierda: Galería Editorial (7 columnas) */}
        <div className="lg:col-span-7 w-full">
          <ProductGallery
            images={product.images}
            activeImageId={activeImageId}
          />
        </div>

        {/* Columna Derecha: Información y Compra (5 columnas, Sticky) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
          {/* Header de Producto estilo Kith */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                  {product.category.name}
                </span>
              )}
              {discountBadge && (
                <span className="bg-black text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
                  {discountBadge.label}
                </span>
              )}
              {newBadge && !discountBadge && (
                <span className="bg-white text-black border border-black text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
                  Nuevo Drop
                </span>
              )}
              {stockBadge && (
                <span className="bg-zinc-900 text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5">
                  {stockBadge.label}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-zinc-950 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Selector de Variantes, Precios y CTA */}
          <ProductVariantSelector
            productName={product.name}
            productSlug={product.slug}
            basePrice={product.base_price}
            compareAtPrice={product.compare_at_price}
            variants={product.variants}
            onVariantSelect={handleVariantSelect}
          />

          {/* Acordeones Editoriales Kith con Separadores Negros */}
          <div className="border-t border-black divide-y divide-black/15 pt-2">
            {/* 01 / DESCRIPCIÓN & DETALLES */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('detalles')}
                className="w-full py-4 flex items-center justify-between text-left group"
              >
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-950 group-hover:text-zinc-600 transition">
                  01 / Detalles &amp; Especificaciones
                </span>
                <ChevronDown
                  className={`size-4 text-zinc-500 transition-transform duration-300 ${
                    openAccordion === 'detalles' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'detalles' && (
                <div className="pb-5 pt-1 text-xs text-zinc-600 leading-relaxed space-y-3 font-normal">
                  {product.description ? (
                    <div className="whitespace-pre-line">
                      {product.description}
                    </div>
                  ) : (
                    <p className="text-zinc-400 italic">
                      Artículo original seleccionado de importación. Comunícate con nosotros para medidas exactas o consultas técnicas de este modelo.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 02 / LOCAL FÍSICO & RETIRO */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('retiro')}
                className="w-full py-4 flex items-center justify-between text-left group"
              >
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-950 group-hover:text-zinc-600 transition">
                  02 / Venta &amp; Retiro en Local (Sin Envíos)
                </span>
                <ChevronDown
                  className={`size-4 text-zinc-500 transition-transform duration-300 ${
                    openAccordion === 'retiro' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'retiro' && (
                <div className="pb-5 pt-1 text-xs text-zinc-600 leading-relaxed space-y-2.5">
                  <p>
                    <strong className="text-zinc-900 font-semibold uppercase tracking-wider text-[11px] block">
                      Venta y Retiro Exclusivo en Mostrador (Sin Envíos):
                    </strong>
                    Podés pasar a retirar tu producto directamente por nuestro local comercial en:
                  </p>
                  <p className="font-bold text-zinc-900 uppercase text-[11px] bg-zinc-50 p-2.5 border border-black/10">
                    Av. Alem 2874, B° Villa Azalais, Córdoba Capital
                  </p>
                  <div>
                    <strong className="text-zinc-900 font-semibold uppercase tracking-wider text-[11px] block mb-1">
                      Horarios de Atención:
                    </strong>
                    <ul className="space-y-0.5 text-[11px] text-zinc-600 font-mono">
                      <li>• Lun a Vie: 9:30 a 13:00 / 16:00 a 20:30</li>
                      <li>• Sábados: 9:30 a 20:30 (de corrido)</li>
                      <li>• Domingos: 10:00 a 13:00</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 03 / FORMAS DE PAGO */}
            <div>
              <button
                type="button"
                onClick={() => toggleAccordion('pagos')}
                className="w-full py-4 flex items-center justify-between text-left group"
              >
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-950 group-hover:text-zinc-600 transition">
                  03 / Medios de Pago Aceptados
                </span>
                <ChevronDown
                  className={`size-4 text-zinc-500 transition-transform duration-300 ${
                    openAccordion === 'pagos' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openAccordion === 'pagos' && (
                <div className="pb-5 pt-1 text-xs text-zinc-600 leading-relaxed space-y-2">
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="p-2 border border-black/10 bg-zinc-50">
                      <span className="font-bold text-zinc-900 uppercase text-[11px] block">💵 Efectivo</span>
                      <span className="text-[10px] text-zinc-500">Pago directo en mostrador al retirar</span>
                    </div>
                    <div className="p-2 border border-black/10 bg-zinc-50">
                      <span className="font-bold text-zinc-900 uppercase text-[11px] block">📱 Transferencia</span>
                      <span className="text-[10px] text-zinc-500">Transferencias bancarias y billeteras virtuales</span>
                    </div>
                    <div className="p-2 border border-black/10 bg-zinc-50">
                      <span className="font-bold text-zinc-900 uppercase text-[11px] block">💳 Tarjetas de Crédito (+10%)</span>
                      <span className="text-[10px] text-zinc-500">Aplica recargo del 10% sobre el total</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior Fija para Mobile (Estilo Sticky Buy Bar Kith) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black p-3 px-4 flex items-center justify-between gap-3 shadow-xl">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-tight text-zinc-950 truncate">
            {product.name}
          </p>
          <p className="text-xs font-bold text-zinc-900 font-mono">
            {formatCurrency(product.base_price)}
          </p>
        </div>

        {quickWhatsappUrl && (
          <a
            href={quickWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-black hover:bg-zinc-800 text-white font-black tracking-[0.2em] uppercase text-[11px] py-3 px-5 flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="size-3.5" />
            <span>Pedir WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  )
}
