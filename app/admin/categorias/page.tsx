import { getCategoriesWithCountService } from '@/services/categories.service'
import { CategoriesTable } from '@/components/admin/CategoriesTable'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCountService()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          Organización del Catálogo
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Categorías y Subcategorías
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Administrá la estructura jerárquica del catálogo con imágenes optimizadas en formato WebP y limpieza automática de Storage.
        </p>
      </div>

      <CategoriesTable initialCategories={categories} />
    </div>
  )
}
