import Link from 'next/link'
import { formatCurrencyARS } from '@/utils/formatters'
import type { LowStockAlertItem } from '@/services/dashboard.service'

interface LowStockAlertsTableProps {
  alerts: LowStockAlertItem[]
}

export function LowStockAlertsTable({ alerts }: LowStockAlertsTableProps) {
  return (
    <section
      aria-label="Alertas de Stock Bajo"
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 border-b border-zinc-200">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Control de Existencias
          </p>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            Alertas de Stock Bajo ({alerts.length})
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stock"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            Ajustar Stock
          </Link>
          <Link
            href="/admin/productos"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Ver Productos
          </Link>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-zinc-900">
            Todas las variantes activas superan el umbral mínimo de stock.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Cuando una variante tenga stock menor o igual a su alerta mínima aparecerá listada aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-[#fafafa] text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Producto / Variante</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Precio Vigente</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4">Mínimo</th>
                <th className="py-3 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {alerts.map((item) => {
                const isOut = item.stockQuantity <= 0
                return (
                  <tr
                    key={item.variantId}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {item.variantName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600">
                      {item.sku || '—'}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900">
                      {formatCurrencyARS(item.effectivePrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          isOut
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isOut
                          ? 'Sin stock (0)'
                          : `${item.stockQuantity} unid.`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">
                      {item.minStockAlert} unid.
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/stock?variantId=${encodeURIComponent(item.variantId)}`}
                        className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
                      >
                        Reponer stock
                      </Link>
                      <Link
                        href={`/admin/productos?q=${encodeURIComponent(item.sku || item.productName)}`}
                        className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                      >
                        Editar producto
                      </Link>
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
