import Link from 'next/link'
import { formatCurrencyARS } from '@/utils/formatters'
import type { LowStockAlertItem } from '@/services/dashboard.service'
import { AlertCircle, ArrowRight, ArrowUpDown, Package } from 'lucide-react'

interface LowStockAlertsTableProps {
  alerts: LowStockAlertItem[]
}

export function LowStockAlertsTable({ alerts }: LowStockAlertsTableProps) {
  return (
    <section
      aria-label="Alertas de Stock Bajo"
      className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <AlertCircle className="size-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 leading-tight">
              Productos con Poco Stock ({alerts.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Artículos que llegaron al límite mínimo o están sin stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-2xs"
          >
            <ArrowUpDown className="size-3.5" />
            <span>Ingresar Stock</span>
          </Link>
          <Link
            href="/admin/productos"
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
            ✓
          </div>
          <p className="text-sm font-semibold text-zinc-900">
            ¡Excelente! Tenés stock de todos tus productos activos.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Cuando algún producto tenga pocas unidades o se agote, aparecerá acá para que lo repongas rápidamente.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA MOBILE: Tarjetas táctiles (md:hidden) */}
          <div className="divide-y divide-zinc-100 md:hidden">
            {alerts.map((item) => {
              const isOut = item.stockQuantity <= 0
              return (
                <div key={item.variantId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 leading-tight">
                        {item.productName}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Variante: {item.variantName}{' '}
                        {item.sku ? `(SKU: ${item.sku})` : ''}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold shrink-0 ${
                        isOut
                          ? 'border border-red-200 bg-red-50 text-red-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isOut ? 'Agotado (0)' : `Quedan ${item.stockQuantity}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <div>
                      Precio:{' '}
                      <strong className="font-semibold text-zinc-900">
                        {formatCurrencyARS(item.effectivePrice)}
                      </strong>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Mínimo deseado: {item.minStockAlert} unid.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/admin/stock?variantId=${encodeURIComponent(
                        item.variantId
                      )}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-zinc-900 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
                    >
                      <ArrowUpDown className="size-3" />
                      <span>Reponer stock</span>
                    </Link>
                    <Link
                      href={`/admin/productos?q=${encodeURIComponent(
                        item.sku || item.productName
                      )}`}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
                    >
                      Ver producto
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* VISTA DESKTOP: Tabla completa (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Producto / Variante</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Precio</th>
                  <th className="py-3 px-4">Stock Actual</th>
                  <th className="py-3 px-4">Alerta Mínima</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {alerts.map((item) => {
                  const isOut = item.stockQuantity <= 0
                  return (
                    <tr
                      key={item.variantId}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.variantName}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        {item.sku || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        {formatCurrencyARS(item.effectivePrice)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                            isOut
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isOut
                            ? 'Agotado (0)'
                            : `${item.stockQuantity} unid.`}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        {item.minStockAlert} unid.
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/admin/stock?variantId=${encodeURIComponent(
                            item.variantId
                          )}`}
                          className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors"
                        >
                          Reponer stock
                        </Link>
                        <Link
                          href={`/admin/productos?q=${encodeURIComponent(
                            item.sku || item.productName
                          )}`}
                          className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                          Editar
                        </Link>
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
