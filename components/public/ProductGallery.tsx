'use client'

import { useState, useRef, useEffect, type MouseEvent } from 'react'
import Image from 'next/image'
import type { ProductImageRow } from '@/types/database.types'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductGalleryProps {
  images: ProductImageRow[]
  activeImageId?: string | null
}

export function ProductGallery({ images, activeImageId }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Sync selected image if activeImageId changes from variant selection
  useEffect(() => {
    if (!activeImageId || images.length === 0) return
    const idx = images.findIndex((img) => img.id === activeImageId)
    if (idx !== -1) {
      setSelectedIndex(idx)
    }
  }, [activeImageId, images])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomCoords({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    })
  }

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full bg-[#f5f5f5] flex items-center justify-center text-zinc-300 border border-zinc-200">
        <Package className="size-16 stroke-[1.2]" />
      </div>
    )
  }

  const currentImage = images[selectedIndex] ?? images[0]

  return (
    <div className="space-y-4 w-full">
      {/* Contenedor Principal de Imagen estilo Editorial Kith 3:4 */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5] border border-black/10 cursor-crosshair select-none group"
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt_text || 'Foto del producto'}
          fill
          priority
          quality={80}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 50vw"
          className={`object-cover transition-transform duration-150 ${
            isZooming ? 'scale-[2.2]' : 'scale-100'
          }`}
          style={
            isZooming
              ? {
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                }
              : undefined
          }
        />

        {/* Indicador de Zoom */}
        {isZooming && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 pointer-events-none">
            Zoom 2.2x
          </div>
        )}

        {/* Contador Editorial Minimalista Kith (ej: 01 / 04) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/85 text-white font-mono text-[10px] tracking-[0.2em] px-2.5 py-1 pointer-events-none">
            {String(selectedIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </div>
        )}

        {/* Flechas de Navegación Rápidas para Mobile / Desktop */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-black/20"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              aria-label="Siguiente foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 bg-white/90 hover:bg-black hover:text-white text-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-black/20"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Tira de Miniaturas Proporción 3:4 Kith Editorial */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[3/4] w-16 sm:w-20 shrink-0 overflow-hidden bg-[#f5f5f5] transition-all ${
                  isSelected
                    ? 'ring-2 ring-black border border-black opacity-100'
                    : 'border border-zinc-200 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `Miniatura ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
