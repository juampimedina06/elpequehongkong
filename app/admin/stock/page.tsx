import Link from 'next/link'
import { getStockAdminPageDataService } from '@/services/stock.service'
import { StockMovementForm } from '@/components/admin/StockMovementForm'
import { StockHistoryTable } from '@/components/admin/StockHistoryTable'

export const dynamic = 'force-dynamic'

interface AdminStockPageProps {
  searchParams?: Promise<{ variantId?: string }>
}

export default async function AdminStockPage({
  searchParams,
}: AdminStockPageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const { variants, movements } = await getStockAdminPageDataService()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Inventario &amp; Trazabilidad
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Auditoría y Movimientos de Stock
          </h1>
          <p className="text-xs text-zinc-500">
            Registrá ingresos, salidas o ajustes de conteo físico con historial auditable.
          </p>
        </div>

        <Link
          href="/admin/productos"
          className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Ir a Productos y Variantes
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <StockMovementForm
            variants={variants}
            initialVariantId={resolvedParams.variantId}
          />
        </div>

        <div className="lg:col-span-7">
          <StockHistoryTable movements={movements} />
        </div>
      </div>
    </div>
  )
}
