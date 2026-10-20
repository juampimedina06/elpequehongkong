import { formatBytes } from '@/utils/formatters'
import {
  resolveTrafficLightClassName,
  type DashboardMetrics,
  type TrafficLightColor,
} from '@/services/dashboard.service'

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
        label: 'Crítico (> 90%)',
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
        label: 'Óptimo (< 70%)',
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
      className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Infraestructura &amp; Recursos
          </p>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            Monitor de Consumo — Supabase Free Tier
          </h2>
        </div>
        {storage.isFallback ? (
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
            Modo Estimación (Fallback Activo)
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            Telemetría RPC en Tiempo Real
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Base de Datos PostgreSQL (500 MB) */}
        <div className="rounded-lg border border-zinc-200 bg-[#fafafa] p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                Base de Datos PostgreSQL
              </h3>
              <p className="text-[11px] text-zinc-500">
                Límite Plan Free: {formatBytes(storage.db.limitBytes, 0)} (500 MB)
              </p>
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${dbBadge.className}`}
            >
              {dbBadge.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-900">
                {formatBytes(storage.db.usedBytes)} usados
              </span>
              <span className="font-mono text-zinc-600">
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

        {/* 2. Storage Bucket catalog-media (1 GB + contador de fotos) */}
        <div className="rounded-lg border border-zinc-200 bg-[#fafafa] p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">
                Storage Bucket (catalog-media)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Límite Plan Free: {formatBytes(storage.media.limitBytes, 0)} (1 GB) ·{' '}
                <strong className="font-semibold text-zinc-700">
                  {storage.media.totalFilesCount}
                </strong>{' '}
                {storage.media.totalFilesCount === 1
                  ? 'foto WebP subida'
                  : 'fotos WebP subidas'}
              </p>
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${mediaBadge.className}`}
            >
              {mediaBadge.label}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-900">
                {formatBytes(storage.media.usedBytes)} usados
              </span>
              <span className="font-mono text-zinc-600">
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

      {/* 3. Límites Informativos Plan Free (5 GB Egress & 50,000 MAU) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2.5 text-xs">
          <div>
            <span className="font-medium text-zinc-900">
              Ancho de Banda (Cached / Uncached Egress)
            </span>
            <p className="text-[11px] text-zinc-500">
              Protegido con compresión WebP &lt; 150 KB y Cache-Control 1 año
            </p>
          </div>
          <span className="font-mono font-semibold text-zinc-900">
            {formatBytes(storage.egressLimitBytes, 0)} / mes
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2.5 text-xs">
          <div>
            <span className="font-medium text-zinc-900">
              Usuarios Activos Mensuales (MAU Auth)
            </span>
            <p className="text-[11px] text-zinc-500">
              Rutas públicas sin consumo de sesión en Edge Middleware
            </p>
          </div>
          <span className="font-mono font-semibold text-zinc-900">
            {storage.mauLimit.toLocaleString('es-AR')} MAU
          </span>
        </div>
      </div>
    </section>
  )
}
