import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeProductBadges,
  resolveEffectivePrice,
  resolveVariantAvailability,
  type ProductBadgeInput,
} from '@/utils/product-badges'
import {
  filterAndSortPublicCatalog,
  type PublicCatalogFilterOptions,
} from '@/services/products.service'
import type { ProductWithRelations } from '@/types/database.types'

describe('Work Unit 9 (TICKET-09): Catalog Filters, Product Badges & SEO', () => {
  describe('REQ-CATALOG-01: Automatic Badges Computation (utils/product-badges)', () => {
    const fixedNow = new Date('2026-10-20T12:00:00.000Z')

    test('computes "Nuevo" badge when created within 7 days and omits when older', () => {
      const recentProduct: ProductBadgeInput = {
        base_price: 1000,
        created_at: new Date(fixedNow.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
      const oldProduct: ProductBadgeInput = {
        base_price: 1000,
        created_at: new Date(fixedNow.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      }

      const badgesRecent = computeProductBadges(recentProduct, fixedNow)
      const badgesOld = computeProductBadges(oldProduct, fixedNow)

      assert.ok(badgesRecent.some((b) => b.type === 'new' && b.label === 'Nuevo'))
      assert.ok(!badgesOld.some((b) => b.type === 'new'))
    })

    test('computes exact "-X% OFF" badge when compare_at_price > base_price', () => {
      const discounted: ProductBadgeInput = {
        base_price: 8000,
        compare_at_price: 10000,
      }
      const normal: ProductBadgeInput = {
        base_price: 10000,
        compare_at_price: 10000,
      }
      const invalidCompare: ProductBadgeInput = {
        base_price: 10000,
        compare_at_price: 9000,
      }

      const badgesDiscount = computeProductBadges(discounted, fixedNow)
      const discountBadge = badgesDiscount.find((b) => b.type === 'discount')
      assert.ok(discountBadge)
      assert.equal(discountBadge.discountPercent, 20)
      assert.equal(discountBadge.label, '-20% OFF')

      assert.ok(!computeProductBadges(normal, fixedNow).some((b) => b.type === 'discount'))
      assert.ok(!computeProductBadges(invalidCompare, fixedNow).some((b) => b.type === 'discount'))
    })

    test('computes stock status badges: "Sin stock" vs "Últimas unidades" vs "Disponible"', () => {
      const outOfStock: ProductBadgeInput = {
        base_price: 1000,
        total_stock: 0,
      }
      const lowStock: ProductBadgeInput = {
        base_price: 1000,
        total_stock: 2,
        min_stock_alert: 3,
      }
      const plentyStock: ProductBadgeInput = {
        base_price: 1000,
        total_stock: 20,
        min_stock_alert: 3,
      }

      const badgesOut = computeProductBadges(outOfStock, fixedNow)
      assert.ok(badgesOut.some((b) => b.type === 'out_of_stock' && b.label === 'Sin stock'))

      const badgesLow = computeProductBadges(lowStock, fixedNow)
      assert.ok(badgesLow.some((b) => b.type === 'low_stock' && b.label === 'Últimas 2 unidades'))

      const badgesPlenty = computeProductBadges(plentyStock, fixedNow)
      assert.ok(!badgesPlenty.some((b) => b.type === 'out_of_stock' || b.type === 'low_stock'))
    })

    test('computes "Destacado" badge when is_featured is true', () => {
      const featured: ProductBadgeInput = {
        base_price: 1000,
        is_featured: true,
      }
      const badges = computeProductBadges(featured, fixedNow)
      assert.ok(badges.some((b) => b.type === 'featured' && b.label === 'Destacado'))
    })
  })

  describe('REQ-CATALOG-02: Variant Price & Availability Resolution', () => {
    test('resolves effective price using price_override when present, otherwise base_price', () => {
      const basePrice = 5000
      assert.equal(resolveEffectivePrice(basePrice, null), 5000)
      assert.equal(resolveEffectivePrice(basePrice, { price_override: 6500 }), 6500)
      assert.equal(resolveEffectivePrice(basePrice, { price_override: null }), 5000)
    })

    test('resolves variant availability state and human-readable label', () => {
      assert.deepEqual(
        resolveVariantAvailability({ stock_quantity: 0, min_stock_alert: 3 }),
        { status: 'out_of_stock', label: 'Agotado', isAvailable: false }
      )
      assert.deepEqual(
        resolveVariantAvailability({ stock_quantity: 2, min_stock_alert: 3 }),
        { status: 'low_stock', label: 'Últimas 2 unidades', isAvailable: true }
      )
      assert.deepEqual(
        resolveVariantAvailability({ stock_quantity: 10, min_stock_alert: 3 }),
        { status: 'in_stock', label: 'Disponible', isAvailable: true }
      )
    })
  })

  describe('REQ-CATALOG-03: Filter and Sort Public Catalog Items', () => {
    const mockProducts: ProductWithRelations[] = [
      {
        id: 'p-1',
        name: 'Mochila Urbana Negra',
        slug: 'mochila-urbana-negra',
        description: 'Mochila espaciosa para viaje o estudio',
        base_price: 15000,
        compare_at_price: 18000,
        category_id: 'cat-1',
        status: 'active',
        is_featured: true,
        created_at: '2026-10-10T10:00:00Z',
        updated_at: '2026-10-10T10:00:00Z',
        category: {
          id: 'cat-1',
          name: 'Bolsos y Mochilas',
          slug: 'bolsos-y-mochilas',
          description: null,
          parent_id: null,
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 1,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        variants: [
          {
            id: 'v-1',
            product_id: 'p-1',
            sku: 'MOCH-NEG-L',
            name: 'Grande Negra',
            size: 'L',
            color: 'Negro',
            dimensions: null,
            price_override: null,
            stock_quantity: 5,
            min_stock_alert: 2,
            image_id: null,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
      },
      {
        id: 'p-2',
        name: 'Botella Térmica 500ml',
        slug: 'botella-termica-500ml',
        description: 'Acero inoxidable doble capa',
        base_price: 8000,
        compare_at_price: null,
        category_id: 'cat-2',
        status: 'active',
        is_featured: false,
        created_at: '2026-10-15T10:00:00Z',
        updated_at: '2026-10-15T10:00:00Z',
        category: {
          id: 'cat-2',
          name: 'Bazar',
          slug: 'bazar',
          description: null,
          parent_id: null,
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 2,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        variants: [
          {
            id: 'v-2',
            product_id: 'p-2',
            sku: 'BOT-TERM-SILV',
            name: 'Plateada',
            size: '500ml',
            color: 'Plata',
            dimensions: null,
            price_override: null,
            stock_quantity: 0, // out of stock
            min_stock_alert: 2,
            image_id: null,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
      },
      {
        id: 'p-3',
        name: 'Taza Cerámica Vintage',
        slug: 'taza-ceramica-vintage',
        description: 'Taza artesanal esmaltada',
        base_price: 4500,
        compare_at_price: 5000,
        category_id: 'cat-2',
        status: 'active',
        is_featured: false,
        created_at: '2026-10-18T10:00:00Z',
        updated_at: '2026-10-18T10:00:00Z',
        category: {
          id: 'cat-2',
          name: 'Bazar',
          slug: 'bazar',
          description: null,
          parent_id: null,
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 2,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        variants: [
          {
            id: 'v-3',
            product_id: 'p-3',
            sku: 'TAZA-VINT-BLAN',
            name: 'Blanca',
            size: null,
            color: 'Blanco',
            dimensions: null,
            price_override: null,
            stock_quantity: 12,
            min_stock_alert: 3,
            image_id: null,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        images: [],
      },
    ]

    test('filters by search term matching name or SKU', () => {
      const byName = filterAndSortPublicCatalog(mockProducts, { q: 'mochila' })
      assert.equal(byName.length, 1)
      assert.equal(byName[0].id, 'p-1')

      const bySku = filterAndSortPublicCatalog(mockProducts, { q: 'BOT-TERM' })
      assert.equal(bySku.length, 1)
      assert.equal(bySku[0].id, 'p-2')
    })

    test('filters by category slug', () => {
      const filtered = filterAndSortPublicCatalog(mockProducts, { categoria: 'bazar' })
      assert.equal(filtered.length, 2)
      assert.ok(filtered.every((p) => p.category?.slug === 'bazar'))
    })

    test('filters hierarchically: selecting parent category includes child subcategory products', () => {
      const mockCategories = [
        {
          id: 'cat-parent-pepe',
          name: 'Pepe',
          slug: 'pepe',
          description: null,
          parent_id: null,
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 1,
          created_at: '',
          updated_at: '',
        },
        {
          id: 'cat-child-pepito',
          name: 'Pepito',
          slug: 'pepito',
          description: null,
          parent_id: 'cat-parent-pepe',
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 2,
          created_at: '',
          updated_at: '',
        },
      ]

      const hierarchicalProducts: ProductWithRelations[] = [
        {
          ...mockProducts[0],
          id: 'p-pepe-direct',
          category_id: 'cat-parent-pepe',
          category: mockCategories[0],
        },
        {
          ...mockProducts[1],
          id: 'p-pepito-child',
          category_id: 'cat-child-pepito',
          category: mockCategories[1],
        },
        {
          ...mockProducts[2],
          id: 'p-other',
          category_id: 'cat-other',
          category: {
            ...mockCategories[0],
            id: 'cat-other',
            slug: 'otra-categoria',
          },
        },
      ]

      // Selecting parent 'pepe' should include both direct products and child 'pepito' products
      const parentFiltered = filterAndSortPublicCatalog(
        hierarchicalProducts,
        { categoria: 'pepe' },
        mockCategories
      )
      assert.equal(parentFiltered.length, 2)
      assert.ok(parentFiltered.some((p) => p.id === 'p-pepe-direct'))
      assert.ok(parentFiltered.some((p) => p.id === 'p-pepito-child'))

      // Selecting subcategory 'pepito' strictly filters to 'pepito' only
      const subcatFiltered = filterAndSortPublicCatalog(
        hierarchicalProducts,
        { categoria: 'pepe', subcategoria: 'pepito' },
        mockCategories
      )
      assert.equal(subcatFiltered.length, 1)
      assert.equal(subcatFiltered[0].id, 'p-pepito-child')
    })

    test('filters by stock availability (enStock: true)', () => {
      const inStockOnly = filterAndSortPublicCatalog(mockProducts, { enStock: true })
      assert.equal(inStockOnly.length, 2)
      assert.ok(!inStockOnly.some((p) => p.id === 'p-2'))
    })

    test('filters by minPrice and maxPrice range', () => {
      const priceFiltered = filterAndSortPublicCatalog(mockProducts, {
        minPrice: 5000,
        maxPrice: 10000,
      })
      assert.equal(priceFiltered.length, 1)
      assert.equal(priceFiltered[0].id, 'p-2')
    })

    test('sorts by precio_asc, precio_desc and recientes', () => {
      const asc = filterAndSortPublicCatalog(mockProducts, { orden: 'precio_asc' })
      assert.deepEqual(asc.map((p) => p.id), ['p-3', 'p-2', 'p-1'])

      const desc = filterAndSortPublicCatalog(mockProducts, { orden: 'precio_desc' })
      assert.deepEqual(desc.map((p) => p.id), ['p-1', 'p-2', 'p-3'])

      const recientes = filterAndSortPublicCatalog(mockProducts, { orden: 'recientes' })
      assert.deepEqual(recientes.map((p) => p.id), ['p-3', 'p-2', 'p-1'])
    })
  })
})
