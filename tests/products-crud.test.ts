import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateBulkUpdatedPrice,
  filterAdminProducts,
  computeDiscardedStoragePaths,
  normalizeProductGalleryOrder,
  bulkUpdateProductPricesService,
  saveProductWithRelationsService,
  deleteProductService,
  updateProductQuickFieldsService,
} from '../services/products.service'
import type { ProductWithRelations } from '../types/database.types'

function buildSampleProduct(
  overrides?: Partial<ProductWithRelations>
): ProductWithRelations {
  return {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Tetera Hierro Fundido Dragón',
    slug: 'tetera-hierro-fundido-dragon',
    description: 'Tetera tradicional japonesa 800ml con infusor de acero inoxidable.',
    base_price: 42000,
    compare_at_price: 48000,
    status: 'active',
    is_featured: true,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    category: {
      id: 'cat-1',
      name: 'Bazar Oriental',
      slug: 'bazar-oriental',
      description: null,
      parent_id: null,
      image_url: null,
      storage_path: null,
      is_active: true,
      display_order: 1,
      created_at: '2026-10-20T00:00:00Z',
      updated_at: '2026-10-20T00:00:00Z',
    },
    variants: [
      {
        id: 'var-1',
        product_id: 'prod-1',
        sku: 'TET-DRG-800',
        name: 'Negra 800ml',
        size: '800ml',
        color: 'Negro Mate',
        dimensions: '18x15cm',
        price_override: null,
        stock_quantity: 6,
        min_stock_alert: 2,
        image_id: 'img-1',
        is_active: true,
        created_at: '2026-10-20T00:00:00Z',
        updated_at: '2026-10-20T00:00:00Z',
      },
    ],
    images: [
      {
        id: 'img-1',
        product_id: 'prod-1',
        variant_id: 'var-1',
        url: 'https://demo.supabase.co/storage/v1/object/public/catalog-media/products/tetera-1.webp',
        storage_path: 'products/tetera-1.webp',
        alt_text: 'Tetera Hierro Fundido Vista Frontal',
        display_order: 0,
        is_primary: true,
        created_at: '2026-10-20T00:00:00Z',
      },
      {
        id: 'img-2',
        product_id: 'prod-1',
        variant_id: null,
        url: 'https://demo.supabase.co/storage/v1/object/public/catalog-media/products/tetera-2.webp',
        storage_path: 'products/tetera-2.webp',
        alt_text: 'Tetera Hierro Fundido Detalle',
        display_order: 1,
        is_primary: false,
        created_at: '2026-10-20T00:00:00Z',
      },
    ],
    ...overrides,
  }
}

describe('Work Unit 6 (TICKET-06): Products, Variants, Ordered WebP Gallery & Bulk Price Updater', () => {
  describe('REQ-PROD-01: Products Table Filtering & Inline Actions', () => {
    it('filters products by name, variant SKU, category, and status', () => {
      const products: ProductWithRelations[] = [
        buildSampleProduct({
          id: 'p-1',
          name: 'Tetera Hierro Fundido',
          category_id: 'cat-bazar',
          status: 'active',
        }),
        buildSampleProduct({
          id: 'p-2',
          name: 'Farol Papel Rojo',
          slug: 'farol-papel-rojo',
          category_id: 'cat-deco',
          status: 'draft',
          variants: [
            {
              id: 'var-2',
              product_id: 'p-2',
              sku: 'FAR-ROJ-40',
              name: '40cm',
              size: '40cm',
              color: 'Rojo',
              dimensions: null,
              price_override: null,
              stock_quantity: 15,
              min_stock_alert: 3,
              image_id: null,
              is_active: true,
              created_at: '2026-10-20T00:00:00Z',
              updated_at: '2026-10-20T00:00:00Z',
            },
          ],
        }),
      ]

      // Search by SKU
      const bySku = filterAdminProducts(products, { q: 'FAR-ROJ-40' })
      assert.equal(bySku.length, 1)
      assert.equal(bySku[0].id, 'p-2')

      // Filter by category and status
      const byCatAndStatus = filterAdminProducts(products, {
        categoryId: 'cat-bazar',
        status: 'active',
      })
      assert.equal(byCatAndStatus.length, 1)
      assert.equal(byCatAndStatus[0].id, 'p-1')
    })

    it('updates inline base_price and is_featured flags with validation', async () => {
      let capturedPatch: Record<string, unknown> = {}
      const updated = await updateProductQuickFieldsService(
        'prod-1',
        { base_price: 45900, is_featured: false },
        {
          updateQuickFields: async (_id, patch) => {
            capturedPatch = patch
            return buildSampleProduct({
              id: 'prod-1',
              base_price: patch.base_price ?? 42000,
              is_featured: patch.is_featured ?? true,
            })
          },
        }
      )

      assert.equal(capturedPatch.base_price, 45900)
      assert.equal(capturedPatch.is_featured, false)
      assert.equal(updated.base_price, 45900)
      assert.equal(updated.is_featured, false)

      await assert.rejects(
        async () => {
          await updateProductQuickFieldsService('prod-1', { base_price: -10 })
        },
        /precio base debe ser mayor a 0/i
      )
    })
  })

  describe('REQ-PROD-02: Bulk Percentage Price Update (Scenario 6.1)', () => {
    it('Scenario 6.1: applies +15% bulk update preserving previous price in compare_at_price and supports rounding', async () => {
      // Exact +15% on 1000 -> 1150, on 2500 -> 2875
      const calc1 = calculateBulkUpdatedPrice({
        currentPrice: 1000,
        currentCompareAtPrice: null,
        percentageChange: 15,
        roundToNearest: 1,
        updateCompareAtPrice: true,
      })
      assert.equal(calc1.newBasePrice, 1150)
      assert.equal(calc1.newCompareAtPrice, 1000)

      const calc2 = calculateBulkUpdatedPrice({
        currentPrice: 2500,
        currentCompareAtPrice: 3000,
        percentageChange: 15,
        roundToNearest: 1,
        updateCompareAtPrice: true,
      })
      assert.equal(calc2.newBasePrice, 2875)
      assert.equal(calc2.newCompareAtPrice, 2500)

      // Rounding to nearest 100: 2500 + 15% = 2875 -> 2900
      const calcRounded100 = calculateBulkUpdatedPrice({
        currentPrice: 2500,
        currentCompareAtPrice: null,
        percentageChange: 15,
        roundToNearest: 100,
        updateCompareAtPrice: false,
      })
      assert.equal(calcRounded100.newBasePrice, 2900)
      assert.equal(calcRounded100.newCompareAtPrice, null)

      // Service batch execution for Scenario 6.1
      const persistedUpdates: Array<{
        id: string
        base_price: number
        compare_at_price: number | null
      }> = []

      const batchResult = await bulkUpdateProductPricesService(
        {
          productIds: ['p-1000', 'p-2500'],
          percentageChange: 15,
          roundToNearest: 1,
          updateCompareAtPrice: true,
        },
        {
          fetchProductsByIds: async () => [
            {
              id: 'p-1000',
              slug: 'cuenco-arroz',
              base_price: 1000,
              compare_at_price: null,
            },
            {
              id: 'p-2500',
              slug: 'plato-sushi',
              base_price: 2500,
              compare_at_price: null,
            },
          ],
          updateProductPriceRow: async (id, patch) => {
            persistedUpdates.push({ id, ...patch })
          },
        }
      )

      assert.equal(batchResult.updatedCount, 2)
      assert.deepEqual(persistedUpdates, [
        { id: 'p-1000', base_price: 1150, compare_at_price: 1000 },
        { id: 'p-2500', base_price: 2875, compare_at_price: 2500 },
      ])
    })

    it('rejects percentage adjustments that would result in price <= 0', () => {
      assert.throws(
        () =>
          calculateBulkUpdatedPrice({
            currentPrice: 1000,
            currentCompareAtPrice: null,
            percentageChange: -100,
          }),
        /mayor a 0/i
      )
    })
  })

  describe('REQ-PROD-03 & REQ-PROD-04: Unified Save, Gallery Order & Transactional Orphan Media Cleanup (Scenario 6.2)', () => {
    it('normalizes gallery order and ensures exactly one primary image when images exist', () => {
      const normalized = normalizeProductGalleryOrder([
        {
          url: 'https://demo.supabase.co/products/a.webp',
          storage_path: 'products/a.webp',
          alt_text: 'A',
          display_order: 5,
          is_primary: false,
        },
        {
          url: 'https://demo.supabase.co/products/b.webp',
          storage_path: 'products/b.webp',
          alt_text: 'B',
          display_order: 10,
          is_primary: false,
        },
      ])

      assert.equal(normalized.length, 2)
      assert.equal(normalized[0].display_order, 0)
      assert.equal(normalized[0].is_primary, true)
      assert.equal(normalized[1].display_order, 1)
      assert.equal(normalized[1].is_primary, false)
    })

    it('Scenario 6.2: rolls back newly uploaded WebP files from catalog-media when product/variant save fails in DB', async () => {
      const deletedBatches: string[][] = []

      await assert.rejects(
        async () => {
          await saveProductWithRelationsService(
            {
              name: 'Katana Decorativa',
              slug: 'katana-decorativa',
              base_price: 55000,
              status: 'active',
              newlyUploadedStoragePaths: ['products/img1.webp', 'products/img2.webp'],
              variants: [
                {
                  name: 'Acero Templado',
                  sku: 'KAT-DUP-01',
                  stock_quantity: 4,
                  min_stock_alert: 2,
                  is_active: true,
                },
              ],
              images: [
                {
                  url: 'https://demo.supabase.co/products/img1.webp',
                  storage_path: 'products/img1.webp',
                  display_order: 0,
                  is_primary: true,
                },
                {
                  url: 'https://demo.supabase.co/products/img2.webp',
                  storage_path: 'products/img2.webp',
                  display_order: 1,
                  is_primary: false,
                },
              ],
            },
            {
              persistProductAggregate: async () => {
                throw new Error(
                  'duplicate key value violates unique constraint "product_variants_sku_key"'
                )
              },
              deleteFiles: async (paths) => {
                const list = Array.isArray(paths) ? paths : paths ? [paths] : []
                deletedBatches.push(list)
                return { deletedPaths: list }
              },
            }
          )
        },
        /duplicate key/i
      )

      assert.deepEqual(deletedBatches, [
        ['products/img1.webp', 'products/img2.webp'],
      ])
    })

    it('physically deletes discarded gallery images on product edit and all images on product delete', async () => {
      const discarded = computeDiscardedStoragePaths(
        ['products/tetera-1.webp', 'products/tetera-2.webp'],
        ['products/tetera-1.webp', 'products/tetera-3.webp']
      )
      assert.deepEqual(discarded, ['products/tetera-2.webp'])

      const deletedFromBucket: string[][] = []
      await saveProductWithRelationsService(
        {
          id: 'prod-1',
          name: 'Tetera Hierro Fundido Dragón',
          slug: 'tetera-hierro-fundido-dragon',
          base_price: 42000,
          status: 'active',
          variants: [
            {
              id: 'var-1',
              name: 'Negra 800ml',
              sku: 'TET-DRG-800',
              stock_quantity: 6,
              min_stock_alert: 2,
              is_active: true,
            },
          ],
          images: [
            {
              id: 'img-1',
              url: 'https://demo.supabase.co/products/tetera-1.webp',
              storage_path: 'products/tetera-1.webp',
              display_order: 0,
              is_primary: true,
            },
          ],
        },
        {
          getExistingProduct: async () => buildSampleProduct(),
          persistProductAggregate: async () => buildSampleProduct(),
          deleteFiles: async (paths) => {
            const list = Array.isArray(paths) ? paths : paths ? [paths] : []
            deletedFromBucket.push(list)
            return { deletedPaths: list }
          },
        }
      )

      // tetera-2.webp was removed from gallery during edit -> must be deleted from catalog-media
      assert.deepEqual(deletedFromBucket, [['products/tetera-2.webp']])

      // Full product deletion must delete all product_images storage_paths
      const deletedOnRemove: string[][] = []
      const delRes = await deleteProductService('prod-1', {
        getExistingProduct: async () => buildSampleProduct(),
        deleteProductRow: async () => undefined,
        deleteFiles: async (paths) => {
          const list = Array.isArray(paths) ? paths : paths ? [paths] : []
          deletedOnRemove.push(list)
          return { deletedPaths: list }
        },
      })

      assert.equal(delRes.deletedId, 'prod-1')
      assert.deepEqual(deletedOnRemove, [
        ['products/tetera-1.webp', 'products/tetera-2.webp'],
      ])
    })
  })
})
