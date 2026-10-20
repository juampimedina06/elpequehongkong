import Link from 'next/link'
import { formatCurrencyARS } from '@/utils/formatters'
import type { DashboardMetrics } from '@/services/dashboard.service'

interface InventoryKpisProps {
  kpis: DashboardMetrics['kpis']
}

export function InventoryKpis({ kpis }: InventoryKpisProps) {
  return (
    <section
      aria-label="Indicadores Clave de Inventario"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Catálogo Público
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {kpis.activeProductsCount.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Productos activos visibles en tienda
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/productos"
            className="text-xs font-medium text-zinc-900 hover:underline"
          >
            Gestionar productos &rarr;
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Valorización de Stock
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {formatCurrencyARS(kpis.totalStockValuation)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Suma de stock activo por precio vigente
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/stock"
            className="text-xs font-medium text-zinc-900 hover:underline"
          >
            Auditar inventario &rarr;
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Alertas de Reposición
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              {kpis.lowStockCount.toLocaleString('es-AR')}
            </p>
            {kpis.lowStockCount > 0 ? (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Requiere atención
              </span>
            ) : (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Sin faltantes
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Variantes en o por debajo del stock mínimo
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/stock"
            className="text-xs font-medium text-zinc-900 hover:underline"
          >
            Registrar ingreso de stock &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
