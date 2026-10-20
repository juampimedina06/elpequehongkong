'use client'

import { useState, type FormEvent } from 'react'
import { formatCurrencyARS } from '@/utils/formatters'
import { bulkUpdateProductPricesAction } from '@/actions/products/products.actions'
import type { ProductWithRelations } from '@/types/database.types'

function previewBulkPriceChange(params: {
  currentPrice: number
  currentCompareAtPrice: number | null
  percentageChange: number
  roundToNearest: number
  updateCompareAtPrice: boolean
}) {
  const multiplier = 1 + params.percentageChange / 100
  const rawNewPrice = params.currentPrice * multiplier
  const step = params.roundToNearest > 1 ? params.roundToNearest : 1
  const newBasePrice =
    step > 1
      ? Math.round(rawNewPrice / step) * step
      : Math.round(rawNewPrice * 100) / 100
  return {
    newBasePrice,
    newCompareAtPrice: params.updateCompareAtPrice
      ? params.currentPrice
      : params.currentCompareAtPrice,
  }
}

interface BulkPriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  selectedProducts: ProductWithRelations[]
}

export function BulkPriceUpdateModal({
  isOpen,
  onClose,
  onUpdated,
  selectedProducts,
}: BulkPriceUpdateModalProps) {
  const [percentageChange, setPercentageChange] = useState<string>('15')
  const [roundToNearest, setRoundToNearest] = useState<number>(1)
  const [updateCompareAtPrice, setUpdateCompareAtPrice] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const numericPct = Number(percentageChange)
  const isValidPct =
    Number.isFinite(numericPct) && numericPct !== 0 && numericPct > -100

  const previewItems = selectedProducts.slice(0, 5).map((p) => {
    if (!isValidPct) {
      return {
        id: p.id,
        name: p.name,
        oldPrice: p.base_price,
        newPrice: p.base_price,
        compareAt: p.compare_at_price,
      }
    }
    try {
      const calc = previewBulkPriceChange({
        currentPrice: p.base_price,
        currentCompareAtPrice: p.compare_at_price,
        percentageChange: numericPct,
        roundToNearest,
        updateCompareAtPrice,
      })
      return {
        id: p.id,
        name: p.name,
        oldPrice: p.base_price,
        newPrice: calc.newBasePrice,
        compareAt: calc.newCompareAtPrice,
      }
    } catch {
      return {
        id: p.id,
        name: p.name,
        oldPrice: p.base_price,
        newPrice: p.base_price,
        compareAt: p.compare_at_price,
      }
    }
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!isValidPct) {
      setErrorMessage(
        'Ingresá un porcentaje válido distinto de 0% (ej: 15 para aumentar o -10 para descontar).'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const res = await bulkUpdateProductPricesAction({
        productIds: selectedProducts.map((p) => p.id),
        percentageChange: numericPct,
        roundToNearest,
        updateCompareAtPrice,
      })

      if (!res.success) {
        setErrorMessage(res.error)
        return
      }

      onUpdated()
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error inesperado al actualizar precios en lote.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Actualización masiva de precios por porcentaje"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Modificación Rápida ({selectedProducts.length} seleccionados)
            </p>
            <h2 className="text-base font-bold text-zinc-900">
              Ajustar Precios por Porcentaje (%)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Variación Porcentual (%) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={percentageChange}
                onChange={(e) => setPercentageChange(e.target.value)}
                placeholder="Ej: 15 o -10"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Positivo para aumentar (+15%), negativo para rebajar (-10%).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Redondeo de Precio Final
              </label>
              <select
                value={roundToNearest}
                onChange={(e) => setRoundToNearest(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                <option value={1}>Exacto / Entero ($ 1)</option>
                <option value={10}>Múltiplo de $ 10</option>
                <option value={100}>Múltiplo de $ 100</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-zinc-200 bg-[#fafafa] px-3.5 py-2.5 cursor-pointer">
            <div>
              <span className="text-xs font-medium text-zinc-900">
                Copiar precio anterior en &ldquo;Precio Tachado (compare_at_price)&rdquo;
              </span>
              <p className="text-[11px] text-zinc-500">
                Útil en rebajas o para mostrar la referencia anterior del producto
              </p>
            </div>
            <input
              type="checkbox"
              checked={updateCompareAtPrice}
              onChange={(e) => setUpdateCompareAtPrice(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
          </label>

          {/* Vista previa de impacto */}
          <div className="rounded-lg border border-zinc-200 overflow-hidden">
            <div className="bg-[#fafafa] px-3.5 py-2 border-b border-zinc-200 text-[11px] font-medium text-zinc-600">
              Vista previa de cálculo (primeros {previewItems.length} de{' '}
              {selectedProducts.length} productos)
            </div>
            <div className="divide-y divide-zinc-100 text-xs max-h-40 overflow-y-auto">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3.5 py-2"
                >
                  <span className="font-medium text-zinc-800 truncate max-w-[200px]">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-400 line-through">
                      {formatCurrencyARS(item.oldPrice)}
                    </span>
                    <span className="text-zinc-400">&rarr;</span>
                    <span className="font-semibold text-zinc-900">
                      {formatCurrencyARS(item.newPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidPct}
              className="flex-1 sm:flex-none rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting
                ? 'Actualizando precios...'
                : `Aplicar a ${selectedProducts.length} Productos`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
