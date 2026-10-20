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
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          Catálogo e Inventario
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Productos, Variantes &amp; Galería WebP
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Administrá el catálogo completo, variantes con precios diferenciales, galería ordenable y ajustes masivos de precios por porcentaje.
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
