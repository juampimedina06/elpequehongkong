'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { registerStockMovementAction } from '@/actions/stock/stock.actions'
import type { StockMovementOptionVariant } from '@/services/stock.service'
import type { StockMovementType } from '@/types/database.types'

interface StockMovementFormProps {
  variants: StockMovementOptionVariant[]
  initialVariantId?: string
}

function computeClientPreview(
  currentStock: number,
  movementType: StockMovementType,
  quantity: number
): {
  previousStock: number
  newStock: number
  quantityChange: number
  isValid: boolean
  error?: string
} {
  const safeCurrent = Math.max(0, Math.round(Number(currentStock ?? 0)))
  const safeQty = Math.round(Number(quantity ?? 0))

  if (!Number.isFinite(safeQty)) {
    return {
      previousStock: safeCurrent,
      newStock: safeCurrent,
      quantityChange: 0,
      isValid: false,
      error: 'Cantidad inválida.',
    }
  }

  if (movementType === 'IN') {
    if (safeQty <= 0) {
      return {
        previousStock: safeCurrent,
        newStock: safeCurrent,
        quantityChange: 0,
        isValid: false,
        error: 'Para un ingreso (IN), la cantidad debe ser mayor a 0.',
      }
    }
    return {
      previousStock: safeCurrent,
      newStock: safeCurrent + safeQty,
      quantityChange: safeQty,
      isValid: true,
    }
  }

  if (movementType === 'OUT') {
    if (safeQty <= 0) {
      return {
        previousStock: safeCurrent,
        newStock: safeCurrent,
        quantityChange: 0,
        isValid: false,
        error: 'Para una salida (OUT), la cantidad debe ser mayor a 0.',
      }
    }
    const newStock = safeCurrent - safeQty
    return {
      previousStock: safeCurrent,
      newStock,
      quantityChange: -safeQty,
      isValid: newStock >= 0,
      error:
        newStock < 0
          ? `Stock insuficiente: el stock resultante sería ${newStock}.`
          : undefined,
    }
  }

  const newStock = safeQty
  return {
    previousStock: safeCurrent,
    newStock,
    quantityChange: newStock - safeCurrent,
    isValid: newStock >= 0,
    error:
      newStock < 0
        ? `El conteo físico no puede ser negativo (${newStock}).`
        : undefined,
  }
}

export function StockMovementForm({
  variants,
  initialVariantId = '',
}: StockMovementFormProps) {
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    if (initialVariantId && variants.some((v) => v.id === initialVariantId)) {
      return initialVariantId
    }
    return variants[0]?.id ?? ''
  })
  const [movementType, setMovementType] = useState<StockMovementType>('IN')
  const [quantityInput, setQuantityInput] = useState<string>('1')
  const [reason, setReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return variants
    return variants.filter((item) => {
      const text =
        `${item.productName} ${item.variantName} ${item.sku ?? ''} ${item.size ?? ''} ${item.color ?? ''}`.toLowerCase()
      return text.includes(q)
    })
  }, [variants, searchQuery])

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId]
  )

  const parsedQuantity = Number(quantityInput)
  const preview = useMemo(() => {
    if (!selectedVariant) return null
    return computeClientPreview(
      selectedVariant.stockQuantity,
      movementType,
      Number.isFinite(parsedQuantity) ? parsedQuantity : 0
    )
  }, [selectedVariant, movementType, parsedQuantity])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!selectedVariant) {
      setErrorMessage('Seleccioná un producto/variante.')
      return
    }

    if (!preview || !preview.isValid) {
      setErrorMessage(
        preview?.error ?? 'La cantidad ingresada no produce un stock válido.'
      )
      return
    }

    if (!reason.trim()) {
      setErrorMessage('El motivo del movimiento es obligatorio.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await registerStockMovementAction({
        variantId: selectedVariant.id,
        movementType,
        quantity: Math.round(parsedQuantity),
        reason: reason.trim(),
      })

      if (!response.success) {
        setErrorMessage(response.error)
        return
      }

      setSuccessMessage(
        response.message ?? 'Movimiento registrado correctamente.'
      )
      setReason('')
      setQuantityInput(movementType === 'ADJUSTMENT' ? String(response.data.new_stock) : '1')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm sm:text-base font-bold text-zinc-900">
          Registrar Movimiento de Stock
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Registrá ingresos de compras, ventas o ajustes para mantener tu stock siempre actualizado.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buscador rápido de variante */}
        <div className="space-y-1.5">
          <label
            htmlFor="stock-variant-search"
            className="block text-xs font-medium text-zinc-700"
          >
            Buscar producto, variante o SKU
          </label>
          <input
            id="stock-variant-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const nextQ = e.target.value
              setSearchQuery(nextQ)
              const qLower = nextQ.trim().toLowerCase()
              if (qLower) {
                const firstMatch = variants.find((item) =>
                  `${item.productName} ${item.variantName} ${item.sku ?? ''}`
                    .toLowerCase()
                    .includes(qLower)
                )
                if (firstMatch) {
                  setSelectedVariantId(firstMatch.id)
                }
              }
            }}
            placeholder="Ej: Taza cerámica, TAZ-AZ-01..."
            className="w-full rounded-md border border-zinc-200 bg-[#fafafa] px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Selector de variante activa */}
        <div className="space-y-1.5">
          <label
            htmlFor="stock-variant-select"
            className="block text-xs font-medium text-zinc-700"
          >
            Variante activa ({filteredVariants.length} disponibles)
          </label>
          <select
            id="stock-variant-select"
            value={selectedVariantId}
            onChange={(e) => {
              const nextId = e.target.value
              setSelectedVariantId(nextId)
              const found = variants.find((v) => v.id === nextId)
              if (found && movementType === 'ADJUSTMENT') {
                setQuantityInput(String(found.stockQuantity))
              }
            }}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {filteredVariants.length === 0 ? (
              <option value="">Sin variantes que coincidan con la búsqueda</option>
            ) : (
              filteredVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.productName} — {variant.variantName}
                  {variant.sku ? ` (SKU: ${variant.sku})` : ''} · Stock actual:{' '}
                  {variant.stockQuantity} u.
                </option>
              ))
            )}
          </select>
        </div>

        {/* Tipo de operación */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-zinc-700">
            Tipo de operación
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  type: 'IN' as const,
                  label: 'Ingreso (IN)',
                  desc: 'Compra / Reposición',
                },
                {
                  type: 'OUT' as const,
                  label: 'Salida (OUT)',
                  desc: 'Venta / Baja / Rotura',
                },
                {
                  type: 'ADJUSTMENT' as const,
                  label: 'Ajuste',
                  desc: 'Conteo físico exacto',
                },
              ]
            ).map((option) => {
              const isSelected = movementType === option.type
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setMovementType(option.type)
                    if (option.type === 'ADJUSTMENT' && selectedVariant) {
                      setQuantityInput(String(selectedVariant.stockQuantity))
                    } else if (option.type !== 'ADJUSTMENT') {
                      setQuantityInput('1')
                    }
                  }}
                  className={`rounded-md border px-3 py-2 text-left transition ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-xs font-medium">{option.label}</div>
                  <div
                    className={`text-[10px] ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-400'
                    }`}
                  >
                    {option.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cantidad + Vista Previa en Vivo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="stock-quantity-input"
              className="block text-xs font-medium text-zinc-700"
            >
              {movementType === 'ADJUSTMENT'
                ? 'Nuevo stock físico total'
                : 'Cantidad a mover'}
            </label>
            <input
              id="stock-quantity-input"
              type="number"
              min={movementType === 'ADJUSTMENT' ? 0 : 1}
              step={1}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          {/* Panel de cálculo en vivo */}
          <div className="rounded-md border border-zinc-200/80 bg-[#fafafa] px-3 py-2 flex flex-col justify-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Vista previa de stock
            </span>
            {selectedVariant && preview ? (
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-zinc-600">
                  Actual: <strong>{preview.previousStock}</strong> u.
                </span>
                <span className="text-xs text-zinc-400">→</span>
                <span
                  className={`text-sm font-semibold ${
                    preview.isValid ? 'text-zinc-900' : 'text-red-600'
                  }`}
                >
                  Resultante: {preview.newStock} u. (
                  {preview.quantityChange >= 0
                    ? `+${preview.quantityChange}`
                    : preview.quantityChange}
                  )
                </span>
              </div>
            ) : (
              <span className="mt-1 text-xs text-zinc-400">
                Seleccioná una variante
              </span>
            )}
            {preview && !preview.isValid && preview.error && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {preview.error}
              </p>
            )}
          </div>
        </div>

        {/* Motivo obligatorio */}
        <div className="space-y-1.5">
          <label
            htmlFor="stock-reason-input"
            className="block text-xs font-medium text-zinc-700"
          >
            Motivo del movimiento (obligatorio)
          </label>
          <input
            id="stock-reason-input"
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Reposición proveedor mayorista / Venta local / Conteo físico"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedVariant ||
              !preview ||
              !preview.isValid ||
              !reason.trim()
            }
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? 'Registrando movimiento...'
              : 'Confirmar Movimiento de Stock'}
          </button>
        </div>
      </form>
    </section>
  )
}
