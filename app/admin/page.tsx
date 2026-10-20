import Link from 'next/link'
import { getDashboardMetrics } from '@/services/dashboard.service'
import { InventoryKpis } from '@/components/admin/InventoryKpis'
import { StorageMonitorCard } from '@/components/admin/StorageMonitorCard'
import { LowStockAlertsTable } from '@/components/admin/LowStockAlertsTable'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Panel de Control
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard &amp; Monitor Free Tier
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Estado en tiempo real del inventario, alertas de reposición y consumo de recursos en Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/productos"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            + Gestionar Productos
          </Link>
          <Link
            href="/admin/categorias"
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Categorías
          </Link>
          <Link
            href="/admin/portada"
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Banners Portada
          </Link>
        </div>
      </div>

      <InventoryKpis kpis={metrics.kpis} />

      <StorageMonitorCard storage={metrics.storage} />

      <LowStockAlertsTable alerts={metrics.lowStockAlerts} />
    </div>
  )
}
