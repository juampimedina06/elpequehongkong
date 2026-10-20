import { formatBytes } from '@/utils/formatters'
import {
  resolveTrafficLightClassName,
  type DashboardMetrics,
  type TrafficLightColor,
} from '@/services/dashboard.service'
import { HardDrive, CheckCircle2 } from 'lucide-react'

interface StorageMonitorCardProps {
  storage: DashboardMetrics['storage']
}

function getStatusBadgeLabel(color: TrafficLightColor): {
  label: string
  className: string
} {
  switch (color) {
    case 'red':
      return {
        label: 'Casi lleno (> 90%)',
        className: 'border-red-200 bg-red-50 text-red-700',
      }
    case 'amber':
      return {
        label: 'Atención (70% - 90%)',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
      }
    case 'emerald':
    default:
      return {
        label: 'Espacio de sobra (< 70%)',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
  }
}

export function StorageMonitorCard({ storage }: StorageMonitorCardProps) {
  const dbBadge = getStatusBadgeLabel(storage.db.color)
  const mediaBadge = getStatusBadgeLabel(storage.media.color)
  const dbBarClass = resolveTrafficLightClassName(storage.db.color)
  const mediaBarClass = resolveTrafficLightClassName(storage.media.color)

  return (
    <section
      aria-label="Monitor de Consumo Supabase Free Tier"
      className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <HardDrive className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 leading-tight">
              Capacidad y Almacenamiento
            </h2>
            <p className="text-xs text-zinc-500">
              Espacio disponible para seguir agregando productos y fotos
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span>Todo funcionando al 100%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Base de Datos / Productos */}
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-900">
                Productos y Datos de la Tienda
              </h3>
              <p className="text-[11px] text-zinc-500">
                Capacidad total: {formatBytes(storage.db.limitBytes, 0)} (500 MB)
              </p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dbBadge.className}`}
            >
              {dbBadge.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-800">
                {formatBytes(storage.db.usedBytes)} en uso
              </span>
              <span className="font-mono text-zinc-500 font-semibold">
                {storage.db.percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                role="progressbar"
                aria-valuenow={storage.db.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de Base de Datos PostgreSQL"
                className={`h-full transition-all duration-300 ${dbBarClass}`}
                style={{ width: `${Math.max(2, storage.db.percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Fotos de Productos */}
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-900">
                Fotos de Productos
              </h3>
              <p className="text-[11px] text-zinc-500">
                Capacidad: {formatBytes(storage.media.limitBytes, 0)} (1 GB) ·{' '}
                <strong className="font-semibold text-zinc-700">
                  {storage.media.totalFilesCount}
                </strong>{' '}
                {storage.media.totalFilesCount === 1
                  ? 'foto cargada'
                  : 'fotos cargadas'}
              </p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${mediaBadge.className}`}
            >
              {mediaBadge.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-800">
                {formatBytes(storage.media.usedBytes)} en uso
              </span>
              <span className="font-mono text-zinc-500 font-semibold">
                {storage.media.percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                role="progressbar"
                aria-valuenow={storage.media.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de Storage catalog-media"
                className={`h-full transition-all duration-300 ${mediaBarClass}`}
                style={{ width: `${Math.max(2, storage.media.percentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 text-center sm:text-left pt-1">
        💡 Cada foto que subís se comprime automáticamente para que cargue súper rápido en el celular de tus clientes y nunca te quedes sin espacio.
      </p>
    </section>
  )
}
