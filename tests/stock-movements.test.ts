import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeResultingStock,
  validateStockMovementInput,
  registerStockMovementService,
  filterStockMovements,
  type StockMovementOptionVariant,
} from '../services/stock.service'
import type { StockMovementRow, StockMovementWithDetails } from '../types/database.types'

const sampleVariants: StockMovementOptionVariant[] = [
  {
    id: 'var-taza-azul',
    productId: 'prod-taza',
    productName: 'Taza Cerámica Oriental',
    productSlug: 'taza-ceramica-oriental',
    variantName: 'Azul Cobalto',
    sku: 'TAZ-AZ-01',
    size: '350ml',
    color: 'Azul',
    stockQuantity: 3,
    minStockAlert: 2,
    isActive: true,
  },
  {
    id: 'var-lampara-roja',
    productId: 'prod-lampara',
    productName: 'Lámpara Papel Arroz',
    productSlug: 'lampara-papel-arroz',
    variantName: 'Roja Mediana',
    sku: 'LAM-RO-02',
    size: '40cm',
    color: 'Rojo',
    stockQuantity: 4,
    minStockAlert: 3,
    isActive: true,
  },
]

describe('Work Unit 7 (TICKET-07): Auditable Stock Movements & History', () => {
  describe('REQ-STOCK-02: Live Resulting Stock Preview & Non-Negative Guard (Scenario 7.1)', () => {
    it('computes resulting stock accurately for IN, OUT, and ADJUSTMENT operations', () => {
      const inbound = computeResultingStock(4, 'IN', 10)
      assert.equal(inbound.previousStock, 4)
      assert.equal(inbound.newStock, 14)
      assert.equal(inbound.quantityChange, 10)
      assert.equal(inbound.isValid, true)

      const outboundValid = computeResultingStock(5, 'OUT', 2)
      assert.equal(outboundValid.previousStock, 5)
      assert.equal(outboundValid.newStock, 3)
      assert.equal(outboundValid.quantityChange, -2)
      assert.equal(outboundValid.isValid, true)

      const adjustment = computeResultingStock(4, 'ADJUSTMENT', 9)
      assert.equal(adjustment.previousStock, 4)
      assert.equal(adjustment.newStock, 9)
      assert.equal(adjustment.quantityChange, 5)
      assert.equal(adjustment.isValid, true)
    })

    it('Scenario 7.1: flags outbound movement exceeding current stock as invalid (-2) and rejects before RPC call', async () => {
      const preview = computeResultingStock(3, 'OUT', 5)
      assert.equal(preview.previousStock, 3)
      assert.equal(preview.newStock, -2)
      assert.equal(preview.quantityChange, -5)
      assert.equal(preview.isValid, false)
      assert.match(preview.error ?? '', /negativo|insuficiente/i)

      let rpcCalled = false
      await assert.rejects(
        async () => {
          await registerStockMovementService(
            {
              variantId: 'var-taza-azul',
              movementType: 'OUT',
              quantity: 5,
              reason: 'Venta en mostrador',
            },
            {
              getVariantStockById: async () => ({
                id: 'var-taza-azul',
                stock_quantity: 3,
                product_slug: 'taza-ceramica-oriental',
              }),
              executeMovementRpc: async () => {
                rpcCalled = true
                throw new Error('Should not be called')
              },
            }
          )
        },
        /negativo|insuficiente/i
      )

      assert.equal(rpcCalled, false)
    })

    it('rejects empty reason or non-positive quantities for IN and OUT movements', () => {
      assert.throws(
        () =>
          validateStockMovementInput(
            {
              variantId: 'var-taza-azul',
              movementType: 'IN',
              quantity: 5,
              reason: '   ',
            },
            3
          ),
        /motivo.*obligatorio/i
      )

      assert.throws(
        () =>
          validateStockMovementInput(
            {
              variantId: 'var-taza-azul',
              movementType: 'IN',
              quantity: 0,
              reason: 'Ingreso',
            },
            3
          ),
        /mayor a 0/i
      )
    })
  })

  describe('REQ-STOCK-01: Auditable Stock Movement via RPC & Transactional Fallback (Scenario 7.2)', () => {
    it('Scenario 7.2: executes register_stock_movement RPC for valid IN restock and returns audit record', async () => {
      const rpcCalls: Array<{
        variantId: string
        movementType: string
        quantityChange: number
        reason: string
      }> = []

      const result = await registerStockMovementService(
        {
          variantId: 'var-lampara-roja',
          movementType: 'IN',
          quantity: 10,
          reason: '  Ingreso proveedor importadora  ',
        },
        {
          getVariantStockById: async () => ({
            id: 'var-lampara-roja',
            stock_quantity: 4,
            product_slug: 'lampara-papel-arroz',
          }),
          executeMovementRpc: async (params) => {
            rpcCalls.push(params)
            const row: StockMovementRow = {
              id: 'mov-101',
              variant_id: params.variantId,
              movement_type: params.movementType,
              quantity_change: 10,
              previous_stock: 4,
              new_stock: 14,
              reason: params.reason,
              created_by: 'admin-1',
              created_at: '2026-10-20T04:00:00.000Z',
            }
            return row
          },
        }
      )

      assert.equal(rpcCalls.length, 1)
      assert.deepEqual(rpcCalls[0], {
        variantId: 'var-lampara-roja',
        movementType: 'IN',
        quantityChange: 10,
        reason: 'Ingreso proveedor importadora',
      })
      assert.equal(result.movement.previous_stock, 4)
      assert.equal(result.movement.new_stock, 14)
      assert.equal(result.movement.quantity_change, 10)
      assert.equal(result.productSlug, 'lampara-papel-arroz')
    })

    it('falls back to transactional table update + audit insert when RPC is undeployed', async () => {
      let fallbackCalled = false

      const result = await registerStockMovementService(
        {
          variantId: 'var-taza-azul',
          movementType: 'ADJUSTMENT',
          quantity: 8,
          reason: 'Conteo físico trimestral',
        },
        {
          getVariantStockById: async () => ({
            id: 'var-taza-azul',
            stock_quantity: 3,
            product_slug: 'taza-ceramica-oriental',
          }),
          executeMovementRpc: async () => {
            throw new Error('Could not find the function public.register_stock_movement')
          },
          executeMovementFallback: async (params) => {
            fallbackCalled = true
            return {
              id: 'mov-fallback-1',
              variant_id: params.variantId,
              movement_type: params.movementType,
              quantity_change: params.delta,
              previous_stock: params.previousStock,
              new_stock: params.newStock,
              reason: params.reason,
              created_by: 'admin-1',
              created_at: '2026-10-20T04:10:00.000Z',
            }
          },
        }
      )

      assert.equal(fallbackCalled, true)
      assert.equal(result.movement.previous_stock, 3)
      assert.equal(result.movement.new_stock, 8)
      assert.equal(result.movement.quantity_change, 5)
    })
  })

  describe('REQ-STOCK-03: Filterable Chronological Audit Log', () => {
    const sampleHistory: StockMovementWithDetails[] = [
      {
        id: 'm-3',
        variant_id: sampleVariants[1].id,
        movement_type: 'ADJUSTMENT',
        quantity_change: 2,
        previous_stock: 4,
        new_stock: 6,
        reason: 'Ajuste inventario depósito',
        created_by: 'admin-1',
        created_at: '2026-10-20T03:00:00.000Z',
        variant: {
          id: sampleVariants[1].id,
          name: sampleVariants[1].variantName,
          sku: sampleVariants[1].sku,
          size: sampleVariants[1].size,
          color: sampleVariants[1].color,
          stock_quantity: 6,
          product: {
            id: sampleVariants[1].productId,
            name: sampleVariants[1].productName,
            slug: sampleVariants[1].productSlug,
          },
        },
      },
      {
        id: 'm-2',
        variant_id: sampleVariants[0].id,
        movement_type: 'OUT',
        quantity_change: -2,
        previous_stock: 5,
        new_stock: 3,
        reason: 'Venta mostrador cliente',
        created_by: 'admin-1',
        created_at: '2026-10-20T02:00:00.000Z',
        variant: {
          id: sampleVariants[0].id,
          name: sampleVariants[0].variantName,
          sku: sampleVariants[0].sku,
          size: sampleVariants[0].size,
          color: sampleVariants[0].color,
          stock_quantity: 3,
          product: {
            id: sampleVariants[0].productId,
            name: sampleVariants[0].productName,
            slug: sampleVariants[0].productSlug,
          },
        },
      },
      {
        id: 'm-1',
        variant_id: sampleVariants[0].id,
        movement_type: 'IN',
        quantity_change: 5,
        previous_stock: 0,
        new_stock: 5,
        reason: 'Stock inicial importación',
        created_by: 'admin-1',
        created_at: '2026-10-20T01:00:00.000Z',
        variant: {
          id: sampleVariants[0].id,
          name: sampleVariants[0].variantName,
          sku: sampleVariants[0].sku,
          size: sampleVariants[0].size,
          color: sampleVariants[0].color,
          stock_quantity: 3,
          product: {
            id: sampleVariants[0].productId,
            name: sampleVariants[0].productName,
            slug: sampleVariants[0].productSlug,
          },
        },
      },
    ]

    it('filters movements by movement_type (IN, OUT, ADJUSTMENT) and search query while preserving chronological DESC order', () => {
      const onlyOut = filterStockMovements(sampleHistory, {
        movementType: 'OUT',
      })
      assert.equal(onlyOut.length, 1)
      assert.equal(onlyOut[0].id, 'm-2')

      const bySku = filterStockMovements(sampleHistory, {
        movementType: 'ALL',
        q: 'TAZ-AZ-01',
      })
      assert.deepEqual(
        bySku.map((m) => m.id),
        ['m-2', 'm-1']
      )

      const byReason = filterStockMovements(sampleHistory, {
        q: 'depósito',
      })
      assert.equal(byReason.length, 1)
      assert.equal(byReason[0].id, 'm-3')
    })
  })
})
