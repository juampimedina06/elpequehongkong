import {
  executeRegisterStockMovementRpc,
  executeStockMovementTransactionalFallback,
  getVariantStockByIdFromDb,
  listActiveVariantsForStockForm,
  listStockMovementsWithDetails,
  type ActiveVariantForStockOption,
  type VariantStockSnapshot,
} from '@/services/stock.repository'
import type {
  StockMovementRow,
  StockMovementType,
  StockMovementWithDetails,
} from '@/types/database.types'

export type StockMovementOptionVariant = ActiveVariantForStockOption

export interface StockPreviewCalculation {
  previousStock: number
  newStock: number
  quantityChange: number
  isValid: boolean
  error?: string
}

export interface RegisterStockMovementInput {
  variantId: string
  movementType: StockMovementType
  quantity: number
  reason: string
}

export interface StockMovementFilterInput {
  movementType?: StockMovementType | 'ALL' | ''
  q?: string
  variantId?: string
}

/**
 * Pure deterministic stock calculation for live preview and pre-RPC validation.
 * - `IN`: `currentStock + quantity` (`delta = +quantity`)
 * - `OUT`: `currentStock - quantity` (`delta = -quantity`)
 * - `ADJUSTMENT`: `quantity` is the target physical count (`delta = quantity - currentStock`)
 */
export function computeResultingStock(
  currentStock: number,
  movementType: StockMovementType,
  quantity: number
): StockPreviewCalculation {
  const safeCurrent = Math.max(0, Math.round(Number(currentStock ?? 0)))
  const safeQty = Math.round(Number(quantity ?? 0))

  if (!Number.isFinite(safeQty)) {
    return {
      previousStock: safeCurrent,
      newStock: safeCurrent,
      quantityChange: 0,
      isValid: false,
      error: 'La cantidad ingresada no es un número válido.',
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
    const newStock = safeCurrent + safeQty
    return {
      previousStock: safeCurrent,
      newStock,
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
    const quantityChange = -safeQty
    if (newStock < 0) {
      return {
        previousStock: safeCurrent,
        newStock,
        quantityChange,
        isValid: false,
        error: `Stock insuficiente: el stock resultante no puede ser negativo (${newStock}).`,
      }
    }
    return {
      previousStock: safeCurrent,
      newStock,
      quantityChange,
      isValid: true,
    }
  }

  if (movementType === 'ADJUSTMENT') {
    if (safeQty < 0) {
      return {
        previousStock: safeCurrent,
        newStock: safeQty,
        quantityChange: safeQty - safeCurrent,
        isValid: false,
        error: `El conteo físico de ajuste no puede producir un stock negativo (${safeQty}).`,
      }
    }
    const newStock = safeQty
    const quantityChange = newStock - safeCurrent
    return {
      previousStock: safeCurrent,
      newStock,
      quantityChange,
      isValid: true,
    }
  }

  return {
    previousStock: safeCurrent,
    newStock: safeCurrent,
    quantityChange: 0,
    isValid: false,
    error: 'Tipo de movimiento no soportado.',
  }
}

/**
 * Pure input validator for stock movement submission.
 */
export function validateStockMovementInput(
  input: RegisterStockMovementInput,
  currentStock: number
): {
  variantId: string
  movementType: StockMovementType
  quantity: number
  reason: string
  preview: StockPreviewCalculation
} {
  const cleanVariantId = (input.variantId ?? '').trim()
  if (!cleanVariantId) {
    throw new Error('Seleccioná una variante activa para registrar el movimiento.')
  }

  const validTypes: StockMovementType[] = ['IN', 'OUT', 'ADJUSTMENT']
  if (!validTypes.includes(input.movementType)) {
    throw new Error('El tipo de movimiento seleccionado no es válido.')
  }

  const cleanReason = (input.reason ?? '').trim()
  if (!cleanReason) {
    throw new Error('El motivo del movimiento es obligatorio para la auditoría.')
  }

  const preview = computeResultingStock(
    currentStock,
    input.movementType,
    input.quantity
  )

  if (!preview.isValid) {
    throw new Error(
      preview.error ?? 'El movimiento produciría un stock negativo o inválido.'
    )
  }

  return {
    variantId: cleanVariantId,
    movementType: input.movementType,
    quantity: Math.round(Number(input.quantity)),
    reason: cleanReason,
    preview,
  }
}

/**
 * Pure chronological filter for audit history rows.
 */
export function filterStockMovements(
  movements: StockMovementWithDetails[],
  filters: StockMovementFilterInput
): StockMovementWithDetails[] {
  const typeFilter = (filters.movementType ?? '').trim()
  const variantFilter = (filters.variantId ?? '').trim()
  const query = (filters.q ?? '').trim().toLowerCase()

  const sorted = [...movements].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )

  return sorted.filter((item) => {
    if (
      typeFilter &&
      typeFilter !== 'ALL' &&
      item.movement_type !== (typeFilter as StockMovementType)
    ) {
      return false
    }

    if (variantFilter && item.variant_id !== variantFilter) {
      return false
    }

    if (query) {
      const productName = (item.variant?.product?.name ?? '').toLowerCase()
      const variantName = (item.variant?.name ?? '').toLowerCase()
      const sku = (item.variant?.sku ?? '').toLowerCase()
      const reason = (item.reason ?? '').toLowerCase()

      if (
        !productName.includes(query) &&
        !variantName.includes(query) &&
        !sku.includes(query) &&
        !reason.includes(query)
      ) {
        return false
      }
    }

    return true
  })
}

/**
 * Registers an auditable stock movement via `register_stock_movement` RPC,
 * verifying non-negative resulting stock before calling the DB and falling back
 * to transactional execution if the RPC is not yet provisioned.
 */
export async function registerStockMovementService(
  input: RegisterStockMovementInput,
  deps?: {
    getVariantStockById?: (
      variantId: string
    ) => Promise<VariantStockSnapshot | null>
    executeMovementRpc?: (params: {
      variantId: string
      movementType: StockMovementType
      quantityChange: number
      reason: string
    }) => Promise<StockMovementRow>
    executeMovementFallback?: (params: {
      variantId: string
      movementType: StockMovementType
      delta: number
      previousStock: number
      newStock: number
      reason: string
    }) => Promise<StockMovementRow>
  }
): Promise<{
  movement: StockMovementRow
  productSlug: string | null
}> {
  const getVariantFn = deps?.getVariantStockById ?? getVariantStockByIdFromDb
  const rpcFn = deps?.executeMovementRpc ?? executeRegisterStockMovementRpc
  const fallbackFn =
    deps?.executeMovementFallback ?? executeStockMovementTransactionalFallback

  const snapshot = await getVariantFn((input.variantId ?? '').trim())
  if (!snapshot) {
    throw new Error('La variante seleccionada no existe o fue eliminada.')
  }

  const validated = validateStockMovementInput(input, snapshot.stock_quantity)

  try {
    const movement = await rpcFn({
      variantId: validated.variantId,
      movementType: validated.movementType,
      quantityChange: validated.quantity,
      reason: validated.reason,
    })

    return {
      movement,
      productSlug: snapshot.product_slug,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const isRpcMissing =
      /could not find the function|PGRST202|42883|register_stock_movement/i.test(
        message
      ) && !/negative|negativo|insuficiente|unauthorized/i.test(message)

    if (!isRpcMissing) {
      throw err
    }

    const fallbackMovement = await fallbackFn({
      variantId: validated.variantId,
      movementType: validated.movementType,
      delta: validated.preview.quantityChange,
      previousStock: validated.preview.previousStock,
      newStock: validated.preview.newStock,
      reason: validated.reason,
    })

    return {
      movement: fallbackMovement,
      productSlug: snapshot.product_slug,
    }
  }
}

export async function getStockAdminPageDataService(): Promise<{
  variants: ActiveVariantForStockOption[]
  movements: StockMovementWithDetails[]
}> {
  const [variants, movements] = await Promise.all([
    listActiveVariantsForStockForm(),
    listStockMovementsWithDetails(150),
  ])

  return {
    variants,
    movements,
  }
}
