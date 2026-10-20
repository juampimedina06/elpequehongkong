'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedAdmin,
  type MinimalAuthUserClient,
} from '@/actions/auth/get-user'
import {
  registerStockMovementService,
  type RegisterStockMovementInput,
} from '@/services/stock.service'
import type { StockMovementRow } from '@/types/database.types'

export type StockActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

function revalidateStockRoutes(productSlug?: string | null) {
  try {
    revalidatePath('/admin/stock')
    revalidatePath('/admin')
    revalidatePath('/admin/productos')
    revalidatePath('/catalogo')
    revalidatePath('/')
    revalidatePath('/producto/[slug]', 'page')
    if (productSlug) {
      revalidatePath(`/producto/${productSlug}`)
    }
  } catch {
    // Graceful no-op outside Next.js request context
  }
}

export async function registerStockMovementAction(
  input: RegisterStockMovementInput,
  deps?: { authClient?: MinimalAuthUserClient }
): Promise<StockActionResult<StockMovementRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const { movement, productSlug } = await registerStockMovementService(input)
    revalidateStockRoutes(productSlug)

    return {
      success: true,
      data: movement,
      message: `Movimiento registrado: stock actualizado de ${movement.previous_stock} a ${movement.new_stock} u.`,
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el movimiento de stock.',
    }
  }
}
