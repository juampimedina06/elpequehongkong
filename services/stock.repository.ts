import { createClient } from '@/lib/supabase/server'
import type {
  StockMovementRow,
  StockMovementType,
  StockMovementWithDetails,
} from '@/types/database.types'

export interface VariantStockSnapshot {
  id: string
  stock_quantity: number
  product_slug: string | null
}

export interface ActiveVariantForStockOption {
  id: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string | null
  size: string | null
  color: string | null
  stockQuantity: number
  minStockAlert: number
  isActive: boolean
}

export async function getVariantStockByIdFromDb(
  variantId: string
): Promise<VariantStockSnapshot | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      id,
      stock_quantity,
      product:products (
        slug
      )
    `
    )
    .eq('id', variantId)
    .maybeSingle()

  if (error || !data) return null
  const raw = data as unknown as {
    id: string
    stock_quantity: number
    product?: { slug?: string } | Array<{ slug?: string }> | null
  }

  const productObj = Array.isArray(raw.product)
    ? raw.product[0]
    : raw.product

  return {
    id: String(raw.id),
    stock_quantity: Number(raw.stock_quantity ?? 0),
    product_slug: productObj?.slug ?? null,
  }
}

export async function listActiveVariantsForStockForm(): Promise<
  ActiveVariantForStockOption[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      `
      id,
      product_id,
      sku,
      name,
      size,
      color,
      stock_quantity,
      min_stock_alert,
      is_active,
      product:products!inner (
        id,
        name,
        slug,
        status
      )
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const mapped = (
    data as unknown as Array<{
      id: string
      product_id: string
      sku: string | null
      name: string
      size: string | null
      color: string | null
      stock_quantity: number
      min_stock_alert: number
      is_active: boolean
      product?:
        | { id: string; name: string; slug: string; status: string }
        | Array<{ id: string; name: string; slug: string; status: string }>
        | null
    }>
  ).map((row) => {
    const prod = Array.isArray(row.product) ? row.product[0] : row.product
    return {
      id: String(row.id),
      productId: String(prod?.id ?? row.product_id),
      productName: String(prod?.name ?? 'Producto'),
      productSlug: String(prod?.slug ?? ''),
      variantName: String(row.name ?? 'Única'),
      sku: row.sku ?? null,
      size: row.size ?? null,
      color: row.color ?? null,
      stockQuantity: Number(row.stock_quantity ?? 0),
      minStockAlert: Number(row.min_stock_alert ?? 3),
      isActive: Boolean(row.is_active),
    }
  })

  return mapped.sort((a, b) =>
    `${a.productName} ${a.variantName}`.localeCompare(
      `${b.productName} ${b.variantName}`,
      'es-AR'
    )
  )
}

export async function executeRegisterStockMovementRpc(params: {
  variantId: string
  movementType: StockMovementType
  quantityChange: number
  reason: string
}): Promise<StockMovementRow> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('register_stock_movement', {
    p_variant_id: params.variantId,
    p_type: params.movementType,
    p_quantity_change: params.quantityChange,
    p_reason: params.reason,
  } as never)

  if (error || !data) {
    throw new Error(
      error?.message ?? 'Error al ejecutar RPC register_stock_movement.'
    )
  }

  return data as unknown as StockMovementRow
}

/**
 * Fallback transactional execution when `register_stock_movement` RPC is not yet deployed.
 */
export async function executeStockMovementTransactionalFallback(params: {
  variantId: string
  movementType: StockMovementType
  delta: number
  previousStock: number
  newStock: number
  reason: string
}): Promise<StockMovementRow> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado: se requiere sesión de administrador.')
  }

  const { error: updateErr } = await supabase
    .from('product_variants')
    .update({
      stock_quantity: params.newStock,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', params.variantId)

  if (updateErr) {
    throw new Error(`No se pudo actualizar el stock: ${updateErr.message}`)
  }

  const { data: insertedMovement, error: insertErr } = await supabase
    .from('stock_movements')
    .insert({
      variant_id: params.variantId,
      movement_type: params.movementType,
      quantity_change: params.delta,
      previous_stock: params.previousStock,
      new_stock: params.newStock,
      reason: params.reason,
      created_by: user.id,
    } as never)
    .select('*')
    .single()

  if (insertErr || !insertedMovement) {
    throw new Error(
      insertErr?.message ?? 'No se pudo registrar el movimiento de auditoría.'
    )
  }

  return insertedMovement as unknown as StockMovementRow
}

export async function listStockMovementsWithDetails(
  limit = 150
): Promise<StockMovementWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stock_movements')
    .select(
      `
      id,
      variant_id,
      movement_type,
      quantity_change,
      previous_stock,
      new_stock,
      reason,
      created_by,
      created_at,
      variant:product_variants (
        id,
        name,
        sku,
        size,
        color,
        stock_quantity,
        product:products (
          id,
          name,
          slug
        )
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as unknown as Array<Record<string, unknown>>).map((row) => {
    const rawVariant = Array.isArray(row.variant)
      ? row.variant[0]
      : row.variant

    const vObj = rawVariant as
      | {
          id: string
          name: string
          sku: string | null
          size: string | null
          color: string | null
          stock_quantity: number
          product?:
            | { id: string; name: string; slug: string }
            | Array<{ id: string; name: string; slug: string }>
            | null
        }
      | null
      | undefined

    const rawProduct = vObj
      ? Array.isArray(vObj.product)
        ? vObj.product[0]
        : vObj.product
      : null

    return {
      id: String(row.id),
      variant_id: String(row.variant_id),
      movement_type: row.movement_type as StockMovementType,
      quantity_change: Number(row.quantity_change ?? 0),
      previous_stock: Number(row.previous_stock ?? 0),
      new_stock: Number(row.new_stock ?? 0),
      reason: String(row.reason ?? ''),
      created_by: (row.created_by as string | null) ?? null,
      created_at: String(row.created_at ?? ''),
      variant: vObj
        ? {
            id: String(vObj.id),
            name: String(vObj.name ?? 'Única'),
            sku: vObj.sku ?? null,
            size: vObj.size ?? null,
            color: vObj.color ?? null,
            stock_quantity: Number(vObj.stock_quantity ?? 0),
            product: rawProduct
              ? {
                  id: String(rawProduct.id),
                  name: String(rawProduct.name),
                  slug: String(rawProduct.slug),
                }
              : null,
          }
        : null,
    }
  })
}
