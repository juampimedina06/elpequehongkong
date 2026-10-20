import Link from 'next/link'
import { ArrowRight, Sparkles, Flame } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero Section */}
        <HeroCarousel slides={slides} />

        {/* Categories Section */}
        <CategoryGrid categories={categories} />

        {/* Recién Llegados Section */}
        {newArrivals.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                  Recién Llegados
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition inline-flex items-center gap-1"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {newArrivals.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {/* Destacados / Descubrí Más Section */}
        {showcaseProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-rose-500" />
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                  Destacados y Sugerencias
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition inline-flex items-center gap-1"
              >
                <span>Explorar todo</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {showcaseProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
