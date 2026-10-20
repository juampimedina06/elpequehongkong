'use client'

import { useState, useRef, useEffect, type MouseEvent } from 'react'
import Image from 'next/image'
import type { ProductImageRow } from '@/types/database.types'
import { Package } from 'lucide-react'

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

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300 border border-zinc-200/80">
        <Package className="size-16" />
      </div>
    )
  }

  const currentImage = images[selectedIndex] ?? images[0]

  return (
    <div className="space-y-3 w-full">
      {/* Main Image with Interactive Zoom */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white border border-zinc-200/80 cursor-crosshair shadow-xs select-none"
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt_text || 'Foto del producto'}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
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

        {isZooming && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md pointer-events-none">
            Zoom 2.2x
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-full">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative size-16 shrink-0 rounded-xl overflow-hidden border transition ${
                  isSelected
                    ? 'border-zinc-950 ring-2 ring-zinc-950/20'
                    : 'border-zinc-200/80 hover:border-zinc-300 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || `Miniatura ${idx + 1}`}
                  fill
                  sizes="64px"
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
