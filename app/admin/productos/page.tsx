import { getAdminProductsService } from '@/services/products.service'
import { getCategoriesWithCountService } from '@/services/categories.service'
import { ProductsTable } from '@/components/admin/ProductsTable'

export const dynamic = 'force-dynamic'

interface AdminProductsPageProps {
  searchParams?: Promise<{ q?: string }>
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const [products, categories] = await Promise.all([
    getAdminProductsService(),
    getCategoriesWithCountService(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Catálogo de Productos
        </p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
          Productos y Precios
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Cargá tus productos, fotos, precios y variantes. Podés cambiar precios rápidamente desde acá.
        </p>
      </div>

      <ProductsTable
        initialProducts={products}
        categories={categories}
        initialSearchQuery={resolvedParams.q ?? ''}
      />
    </div>
  )
}
