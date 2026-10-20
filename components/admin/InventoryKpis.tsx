import Link from 'next/link'
import { formatCurrencyARS } from '@/utils/formatters'
import type { DashboardMetrics } from '@/services/dashboard.service'
import { PackageCheck, Coins, AlertTriangle, ArrowRight } from 'lucide-react'

interface InventoryKpisProps {
  kpis: DashboardMetrics['kpis']
}

export function InventoryKpis({ kpis }: InventoryKpisProps) {
  return (
    <section
      aria-label="Indicadores Clave de Inventario"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
    >
      {/* 1. Productos Activos */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Catálogo Activo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <PackageCheck className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            {kpis.activeProductsCount.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Productos publicados y visibles en tu tienda
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 transition"
          >
            <span>Ver todos los productos</span>
            <ArrowRight className="size-3 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* 2. Valorización de Stock */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Valor de Mercadería
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <Coins className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            {formatCurrencyARS(kpis.totalStockValuation)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Estimado de mercadería disponible por precio actual
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 transition"
          >
            <span>Controlar inventario</span>
            <ArrowRight className="size-3 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* 3. Alertas de Reposición */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Stock por Agotarse
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                kpis.lowStockCount > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {kpis.lowStockCount.toLocaleString('es-AR')}
            </p>
            {kpis.lowStockCount > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                Requiere reponer
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Stock al día
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {kpis.lowStockCount > 0
              ? 'Artículos en o por debajo de su stock mínimo'
              : 'No tenés productos con faltantes en este momento'}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 transition"
          >
            <span>Ingresar mercadería</span>
            <ArrowRight className="size-3 text-zinc-400" />
          </Link>
        </div>
      </div>
    </section>
  )
}
