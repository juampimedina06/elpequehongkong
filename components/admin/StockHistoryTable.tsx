'use client'

import { useState, useMemo } from 'react'
import { formatDateTime } from '@/utils/formatters'
import type {
  StockMovementType,
  StockMovementWithDetails,
} from '@/types/database.types'
import { Search, ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react'

interface StockHistoryTableProps {
  movements: StockMovementWithDetails[]
}

const MOVEMENT_BADGES: Record<
  StockMovementType,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  IN: {
    label: 'Ingreso (+)',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: ArrowDownRight,
  },
  OUT: {
    label: 'Salida (-)',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: ArrowUpRight,
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-800',
    icon: RotateCcw,
  },
}

export function StockHistoryTable({ movements }: StockHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState<StockMovementType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMovements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return movements.filter((item) => {
      if (typeFilter !== 'ALL' && item.movement_type !== typeFilter) {
        return false
      }
      if (q) {
        const productName = (item.variant?.product?.name ?? '').toLowerCase()
        const variantName = (item.variant?.name ?? '').toLowerCase()
        const sku = (item.variant?.sku ?? '').toLowerCase()
        const reason = (item.reason ?? '').toLowerCase()
        if (
          !productName.includes(q) &&
          !variantName.includes(q) &&
          !sku.includes(q) &&
          !reason.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [movements, typeFilter, searchQuery])

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3.5 border-b border-zinc-100 p-4 sm:p-5">
        <div>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900">
            Historial de Movimientos
          </h2>
          <p className="text-xs text-zinc-500">
            Registro de todas las entradas, salidas y conteos ({filteredMovements.length} de{' '}
            {movements.length} registros).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por producto, SKU o motivo..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 shrink-0 overflow-x-auto">
            {(
              [
                { value: 'ALL', label: 'Todos' },
                { value: 'IN', label: 'Ingresos' },
                { value: 'OUT', label: 'Salidas' },
                { value: 'ADJUSTMENT', label: 'Ajustes' },
              ] as const
            ).map((tab) => {
              const active = typeFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeFilter(tab.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {filteredMovements.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            No se encontraron movimientos para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA MOBILE: Tarjetas táctiles (md:hidden) */}
          <div className="divide-y divide-zinc-100 md:hidden">
            {filteredMovements.map((movement) => {
              const badge =
                MOVEMENT_BADGES[movement.movement_type] ??
                MOVEMENT_BADGES.ADJUSTMENT
              const Icon = badge.icon
              const deltaFormatted =
                movement.quantity_change > 0
                  ? `+${movement.quantity_change}`
                  : String(movement.quantity_change)

              return (
                <div key={movement.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 leading-tight">
                        {movement.variant?.product?.name ?? 'Producto'}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        {movement.variant?.name ?? 'Variante'}
                        {movement.variant?.sku ? ` · ${movement.variant.sku}` : ''}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${badge.className}`}
                    >
                      <Icon className="size-3" />
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-50/80 p-2.5 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Antes
                      </span>
                      <strong className="text-zinc-700 font-semibold">
                        {movement.previous_stock} u.
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Movimiento
                      </span>
                      <strong
                        className={`font-bold ${
                          movement.quantity_change > 0
                            ? 'text-emerald-700'
                            : movement.quantity_change < 0
                            ? 'text-amber-700'
                            : 'text-zinc-600'
                        }`}
                      >
                        {deltaFormatted} u.
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Nuevo Stock
                      </span>
                      <strong className="text-zinc-900 font-bold">
                        {movement.new_stock} u.
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                    <span className="truncate pr-2">
                      Motivo: <strong className="text-zinc-700">{movement.reason}</strong>
                    </span>
                    <span className="shrink-0 text-zinc-400">
                      {formatDateTime(movement.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* VISTA DESKTOP: Tabla (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Fecha / Hora</th>
                  <th className="px-4 py-3">Producto / Variante</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Antes</th>
                  <th className="px-4 py-3 text-right">Cambio</th>
                  <th className="px-4 py-3 text-right">Nuevo Stock</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredMovements.map((movement) => {
                  const badge =
                    MOVEMENT_BADGES[movement.movement_type] ??
                    MOVEMENT_BADGES.ADJUSTMENT
                  const deltaFormatted =
                    movement.quantity_change > 0
                      ? `+${movement.quantity_change}`
                      : String(movement.quantity_change)

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-zinc-50/70 transition"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {formatDateTime(movement.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900">
                          {movement.variant?.product?.name ?? 'Producto'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {movement.variant?.name ?? 'Variante'}
                          {movement.variant?.sku
                            ? ` · SKU: ${movement.variant.sku}`
                            : ''}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600 font-mono">
                        {movement.previous_stock} u.
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-mono font-bold ${
                          movement.quantity_change > 0
                            ? 'text-emerald-700'
                            : movement.quantity_change < 0
                            ? 'text-amber-700'
                            : 'text-zinc-600'
                        }`}
                      >
                        {deltaFormatted} u.
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-zinc-900">
                        {movement.new_stock} u.
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.reason}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
