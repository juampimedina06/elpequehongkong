'use client'

import { useState, useMemo } from 'react'
import { formatDateTime } from '@/utils/formatters'
import type {
  StockMovementType,
  StockMovementWithDetails,
} from '@/types/database.types'

interface StockHistoryTableProps {
  movements: StockMovementWithDetails[]
}

const MOVEMENT_BADGES: Record<
  StockMovementType,
  { label: string; className: string }
> = {
  IN: {
    label: 'IN · Ingreso',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  OUT: {
    label: 'OUT · Salida',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  ADJUSTMENT: {
    label: 'ADJUSTMENT · Ajuste',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-800',
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
    <section className="rounded-lg border border-zinc-200/80 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Historial Auditable de Movimientos
          </h2>
          <p className="text-xs text-zinc-500">
            Registro cronológico inmutable ({filteredMovements.length} de{' '}
            {movements.length} movimientos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por producto, SKU o motivo..."
            className="w-56 rounded-md border border-zinc-200 bg-[#fafafa] px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />

          <div className="flex items-center rounded-md border border-zinc-200 bg-[#fafafa] p-0.5">
            {(
              [
                { value: 'ALL', label: 'Todos' },
                { value: 'IN', label: 'IN' },
                { value: 'OUT', label: 'OUT' },
                { value: 'ADJUSTMENT', label: 'Ajustes' },
              ] as const
            ).map((tab) => {
              const active = typeFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTypeFilter(tab.value)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? 'bg-zinc-900 text-white'
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
          <p className="text-xs text-zinc-500">
            No se encontraron movimientos de stock para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-[#fafafa] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Producto / Variante</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Stock Anterior</th>
                <th className="px-4 py-3 text-right">Cambio</th>
                <th className="px-4 py-3 text-right">Nuevo Stock</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
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
                      <div className="font-medium text-zinc-900">
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
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-600">
                      {movement.previous_stock} u.
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                        movement.quantity_change > 0
                          ? 'text-emerald-700'
                          : movement.quantity_change < 0
                          ? 'text-amber-700'
                          : 'text-zinc-600'
                      }`}
                    >
                      {deltaFormatted} u.
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-zinc-900">
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
      )}
    </section>
  )
}
