import Link from 'next/link'
import { getDashboardMetrics } from '@/services/dashboard.service'
import { InventoryKpis } from '@/components/admin/InventoryKpis'
import { StorageMonitorCard } from '@/components/admin/StorageMonitorCard'
import { LowStockAlertsTable } from '@/components/admin/LowStockAlertsTable'
import { Plus, Package, FolderTree, Image as ImageIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <div className="space-y-6">
      {/* Saludo y Accesos Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Resumen General
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-0.5">
            ¡Hola! Panel de tu Negocio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Revisá cómo están tus productos, existencias en stock y el estado de tu catálogo online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-sm"
          >
            <Plus className="size-4" />
            <span>Gestionar Productos</span>
          </Link>
          <Link
            href="/admin/categorias"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs"
          >
            <FolderTree className="size-3.5 text-zinc-500" />
            <span>Categorías</span>
          </Link>
          <Link
            href="/admin/portada"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition shadow-2xs"
          >
            <ImageIcon className="size-3.5 text-zinc-500" />
            <span>Fotos Portada</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas de Negocio */}
      <InventoryKpis kpis={metrics.kpis} />

      {/* Alertas de Poco Stock */}
      <LowStockAlertsTable alerts={metrics.lowStockAlerts} />

      {/* Monitor de Almacenamiento Amigable */}
      <StorageMonitorCard storage={metrics.storage} />
    </div>
  )
}
