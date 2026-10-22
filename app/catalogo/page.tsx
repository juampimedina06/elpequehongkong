import type { Metadata } from 'next'
import { queryPublicCatalogPaginated } from '@/services/products.repository'
import { listActiveCategories } from '@/services/categories.repository'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { CatalogFilters } from '@/components/public/CatalogFilters'
import { CatalogProductGrid } from '@/components/public/CatalogProductGrid'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Catálogo de Productos',
  description:
    'Explorá todos nuestros productos, novedades, bazar y regalería con stock actualizado en tiempo real.',
}

interface CatalogoPageProps {
  searchParams: Promise<{
    q?: string
    categoria?: string
    subcategoria?: string
    minPrice?: string
    maxPrice?: string
    orden?: string
    enStock?: string
  }>
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const sp = await searchParams

  const filters = {
    q: sp.q,
    categoria: sp.categoria,
    subcategoria: sp.subcategoria,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    orden: sp.orden,
    enStock: sp.enStock === 'true',
  }

  const [initialResult, categories] = await Promise.all([
    queryPublicCatalogPaginated({
      ...filters,
      page: 0,
      limit: 20,
    }),
    listActiveCategories(),
  ])

  const selectedCategoryName = sp.categoria
    ? categories.find((c) => c.slug === sp.categoria)?.name ?? sp.categoria
    : null

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-black selection:text-white">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-[1760px] w-full px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-12 sm:pb-16 space-y-10">
        {/* Encabezado Editorial */}
        <div className="border-b border-black pb-4 space-y-1">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
            {selectedCategoryName ? `Colección / ${selectedCategoryName}` : 'Catálogo Completo'}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
              {selectedCategoryName || 'Todos los Productos'}
            </h1>
            <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">
              {initialResult.totalCount}{' '}
              {initialResult.totalCount === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>
        </div>

        {/* Controles de Filtros */}
        <CatalogFilters categories={categories} />

        {/* Grilla de Productos con Infinite Scroll y Caché TanStack */}
        <CatalogProductGrid
          initialResult={initialResult}
          filters={filters}
        />
      </main>

      <PublicFooter />
    </div>
  )
}
