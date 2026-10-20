import type { Metadata } from 'next'
import { getPublicCatalogService, filterAndSortPublicCatalog } from '@/services/products.service'
import { listActiveCategories } from '@/services/categories.repository'
import { PublicNavbar } from '@/components/public/PublicNavbar'
import { PublicFooter } from '@/components/public/PublicFooter'
import { CatalogFilters } from '@/components/public/CatalogFilters'
import { ProductCard } from '@/components/public/ProductCard'
import { PackageOpen } from 'lucide-react'

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

  const [allProducts, categories] = await Promise.all([
    getPublicCatalogService(),
    listActiveCategories(),
  ])

  const filteredProducts = filterAndSortPublicCatalog(allProducts, {
    q: sp.q,
    categoria: sp.categoria,
    subcategoria: sp.subcategoria,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    orden: sp.orden,
    enStock: sp.enStock === 'true',
  })

  const selectedCategoryName = sp.categoria
    ? categories.find((c) => c.slug === sp.categoria)?.name ?? sp.categoria
    : null

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-black selection:text-white">
      <PublicNavbar />

      <main className="flex-1 mx-auto max-w-[1760px] w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-14 space-y-10">
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
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>
        </div>

        {/* Controles de Filtros */}
        <CatalogFilters categories={categories} />

        {/* Grilla Editorial de Productos */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-zinc-200 bg-[#fafafa] p-12 sm:p-16 text-center space-y-3">
            <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <PackageOpen className="size-6" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
              No se encontraron productos
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Probá ajustando el término de búsqueda, desmarcando el filtro de stock o seleccionando otra categoría.
            </p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
