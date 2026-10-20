import Link from 'next/link'
import { getStockAdminPageDataService } from '@/services/stock.service'
import { StockMovementForm } from '@/components/admin/StockMovementForm'
import { StockHistoryTable } from '@/components/admin/StockHistoryTable'
import { Package } from 'lucide-react'

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Inventario de Mercadería
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
            Control y Movimientos de Stock
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Cargá ingresos de nueva mercadería, retiros o ajustes para mantener tu inventario exacto.
          </p>
        </div>

        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs"
        >
          <Package className="size-3.5 text-zinc-500" />
          <span>Ver Productos</span>
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
