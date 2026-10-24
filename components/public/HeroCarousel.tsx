'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HeroSlideDescriptor } from '@/services/banners.service'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'

interface HeroCarouselProps {
  slides: HeroSlideDescriptor[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [slides.length])

  if (!slides || slides.length === 0) return null

  const current = slides[currentIndex]

  return (
    <section className="relative w-full overflow-hidden bg-black text-white aspect-[4/3] sm:aspect-[16/7] md:aspect-[21/9] min-h-[440px] sm:min-h-[540px] flex items-end">
      {/* Background Image / Overlay Cinematográfico */}
      {current.image_url ? (
        <div className="absolute inset-0">
          <Image
            src={current.image_url}
            alt={current.title}
            fill
            priority={current.isPriority}
            sizes="100vw"
            quality={80}
            className="object-cover opacity-75 transition-transform duration-1000 scale-100 hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-black to-black" />
      )}

      {/* Contenido Editorial Kith */}
      <div className="relative w-full max-w-[1760px] mx-auto px-6 sm:px-10 lg:px-16 pb-12 sm:pb-16 z-10 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-300">
            Colección {new Date().getFullYear()} / Editorial
          </span>
          <span className="h-px w-10 bg-zinc-400/60" />
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95] max-w-3xl">
          {current.title}
        </h1>

        {current.subtitle && (
          <p className="text-xs sm:text-sm text-zinc-300 tracking-wide font-normal max-w-xl leading-relaxed">
            {current.subtitle}
          </p>
        )}

        <div className="pt-3 flex items-center gap-4">
          <Link
            href={current.link_url}
            className="group inline-flex items-center gap-2.5 border border-white bg-black/40 hover:bg-white hover:text-black text-white px-7 py-3 text-xs uppercase font-extrabold tracking-[0.25em] backdrop-blur-md transition-all duration-300 shadow-xl"
          >
            <span>{current.cta_text || 'Explorar Colección'}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Controles de Navegación Editorial */}
      {slides.length > 1 && (
        <>
          <div className="absolute right-6 sm:right-12 bottom-6 sm:bottom-12 flex items-center gap-3 z-20">
            {/* Contador numérico de slides estilo revista */}
            <span className="font-mono text-[11px] font-bold tracking-widest text-zinc-400 mr-2">
              0{currentIndex + 1} / 0{slides.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
              }
              className="size-9 rounded-full border border-white/30 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center backdrop-blur-md transition-all"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % slides.length)
              }
              className="size-9 rounded-full border border-white/30 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center backdrop-blur-md transition-all"
              aria-label="Slide siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
