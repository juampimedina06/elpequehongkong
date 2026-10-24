import { formatBytes } from '@/utils/formatters'
import {
  resolveTrafficLightClassName,
  type DashboardMetrics,
  type TrafficLightColor,
} from '@/services/dashboard.service'
import { HardDrive, CheckCircle2, Globe, ExternalLink, Zap } from 'lucide-react'

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

  const supabaseUsageUrl = 'https://supabase.com/dashboard/org/ywqwlizgzombxpkwtsfc/usage'

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
              Capacidad y Consumo del Servidor
            </h2>
            <p className="text-xs text-zinc-500">
              Control de límites gratuitos de Supabase (Base de datos, Fotos y Tráfico CDN)
            </p>
          </div>
        </div>

        <a
          href={supabaseUsageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition-colors"
        >
          <span>Panel de Consumo Supabase</span>
          <ExternalLink className="size-3 text-zinc-500" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Base de Datos / Productos */}
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-900">
                Base de Datos y Productos
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
                Espacio en Disco (Storage)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Capacidad: {formatBytes(storage.media.limitBytes, 0)} (1 GB) ·{' '}
                <strong className="font-semibold text-zinc-700">
                  {storage.media.totalFilesCount}
                </strong>{' '}
                {storage.media.totalFilesCount === 1
                  ? 'foto subida'
                  : 'fotos subidas'}
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

        {/* 3. Salida en Caché / Tráfico CDN */}
        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Globe className="size-3.5 text-zinc-600" />
                  <span>Salida en Caché (CDN)</span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Límite: 5.0 GB / mes (Plan Free)
                </p>
              </div>
              <span className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
                Red Cloudflare
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-zinc-700">
                  Protecciones Activas
                </span>
                <span className="font-mono text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                  <Zap className="size-3" /> AVIF & WebP
                </span>
              </div>
              <div className="rounded-lg bg-zinc-100 p-2 text-[11px] text-zinc-600 space-y-1 leading-tight">
                <div className="flex items-center justify-between">
                  <span>Fotos secundarias:</span>
                  <span className="font-semibold text-zinc-800">Bajo demanda</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Caché Next.js:</span>
                  <span className="font-semibold text-zinc-800">1 año (365d)</span>
                </div>
              </div>
            </div>
          </div>

          <a
            href={supabaseUsageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 hover:bg-black text-white px-3 py-1.5 text-[11px] font-semibold transition-colors mt-2"
          >
            <span>Ver Salida en Caché en Supabase</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-[11px] text-zinc-500">
        <p>
          💡 Cada foto se comprime automáticamente a WebP &lt; 150 KB. Las fotos secundarias ya no se descargan anticipadamente en los listados para proteger tu cuota mensual.
        </p>
        <a
          href={supabaseUsageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-700 font-medium hover:underline shrink-0 flex items-center gap-1"
        >
          Ver consumo en vivo en Supabase <ExternalLink className="size-2.5" />
        </a>
      </div>
    </section>
  )
}
