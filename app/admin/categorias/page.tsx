import { getCategoriesWithCountService } from '@/services/categories.service'
import { CategoriesTable } from '@/components/admin/CategoriesTable'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCountService()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Organización de tu Tienda
        </p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
          Categorías de Productos
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Creá y organizá las categorías y subcategorías para que tus clientes encuentren rápido lo que buscan.
        </p>
      </div>

      <CategoriesTable initialCategories={categories} />
    </div>
  )
}
