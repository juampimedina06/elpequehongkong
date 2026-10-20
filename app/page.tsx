import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import {
  getDynamicHomeDataService,
  resolveHeroSlides,
} from '@/services/banners.service'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { HeroCarousel } from '@/components/public/HeroCarousel'
import { CategoryGrid } from '@/components/public/CategoryGrid'
import { ProductCard } from '@/components/public/ProductCard'

export const revalidate = 60

export default async function HomePage() {
  const { banners, categories, newArrivals, showcaseProducts } =
    await getDynamicHomeDataService()

  const slides = resolveHeroSlides(banners)

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-black selection:text-white">
      <PublicNavbar />

      {/* Hero Cinematográfico Full-Bleed */}
      <HeroCarousel slides={slides} />

      {/* Banner de Declaración de Marca estilo Kith Editorial */}
      <section className="border-y border-black bg-white py-6 sm:py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">
            El Peque Hong Kong — Curaduría &amp; Novedades
          </p>
          <p className="text-sm sm:text-lg font-black uppercase tracking-tight text-zinc-950 leading-relaxed">
            Artículos importados seleccionados, bazar, accesorios y tendencias para tu día a día.
          </p>
        </div>
      </section>

      {/* Contenido Principal con Espaciado Editorial Amplio */}
      <main className="flex-1 w-full max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 space-y-16 sm:space-y-24">
        {/* Sección 01: Recién Llegados */}
        {newArrivals.length > 0 && (
          <section id="novedades" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 block mb-1">
                  01 / Drops &amp; Novedades
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
                  Recién Llegados
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="group inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 hover:text-zinc-600 transition"
              >
                <span>Explorar todo</span>
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-7 sm:gap-x-6 sm:gap-y-10">
              {newArrivals.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>

            <div className="pt-2 sm:pt-4 flex justify-center">
              <Link
                href="/catalogo"
                className="border border-black bg-white hover:bg-black hover:text-white text-zinc-950 px-9 sm:px-12 py-3 text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-200"
              >
                SHOP ALL
              </Link>
            </div>
          </section>
        )}

        {/* Sección 02: Colecciones y Categorías */}
        <CategoryGrid categories={categories} />

        {/* Sección 03: Destacados / Curaduría de Selección */}
        {showcaseProducts.length > 0 && (
          <section id="destacados" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 block mb-1">
                  03 / Selección Especial
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
                  Destacados &amp; Esenciales
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="group inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 hover:text-zinc-600 transition"
              >
                <span>Ver catálogo completo</span>
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 gap-y-7 sm:gap-x-6 sm:gap-y-10">
              {showcaseProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>

            <div className="pt-2 sm:pt-4 flex justify-center">
              <Link
                href="/catalogo"
                className="border border-black bg-white hover:bg-black hover:text-white text-zinc-950 px-9 sm:px-12 py-3 text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-200"
              >
                SHOP ALL
              </Link>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
