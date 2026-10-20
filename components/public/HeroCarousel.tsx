'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HeroSlideDescriptor } from '@/services/banners.service'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

interface HeroCarouselProps {
  slides: HeroSlideDescriptor[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides || slides.length === 0) return null

  const current = slides[currentIndex]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-950 aspect-[21/9] sm:aspect-[2.4/1] min-h-[260px] text-white shadow-sm border border-zinc-900/10">
      {/* Background Image / Overlay */}
      {current.image_url ? (
        <div className="absolute inset-0">
          <Image
            src={current.image_url}
            alt={current.title}
            fill
            priority={current.isPriority}
            sizes="100vw"
            className="object-cover opacity-60 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 max-w-2xl space-y-3 z-10">
        <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs w-fit">
          Destacado
        </span>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {current.title}
        </h1>
        {current.subtitle && (
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
            {current.subtitle}
          </p>
        )}
        <div className="pt-2">
          <Link
            href={current.link_url}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition shadow-xs"
          >
            <span>{current.cta_text}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Nav Controls */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition"
            aria-label="Anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition"
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`size-2 rounded-full transition-all ${
                  currentIndex === i ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir a slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
