import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeBannerInput,
  createBannerService,
  updateBannerService,
  deleteBannerService,
  resolveHeroSlides,
  mapProductWithRelationsToShowcaseItem,
  getDynamicHomeDataService,
} from '../services/banners.service'
import type {
  CategoryRow,
  HomeBannerRow,
  ProductWithRelations,
  ShowcaseProductItem,
} from '../types/database.types'

const sampleBanner: HomeBannerRow = {
  id: 'banner-1',
  title: 'Nueva Colección Invierno',
  subtitle: 'Importación directa de bazar y decoración',
  image_url: 'https://cdn.example.com/banners/old-hero.webp',
  storage_path: 'banners/old-hero.webp',
  link_url: '/catalogo?categoria=bazar',
  cta_text: 'Explorar Colección',
  display_order: 1,
  is_active: true,
  created_at: '2026-10-20T00:00:00.000Z',
  updated_at: '2026-10-20T00:00:00.000Z',
}

describe('Work Unit 8 (TICKET-08): Banners Manager & 100% Dynamic Public Home', () => {
  describe('REQ-HOME-01: Banners CRUD & Storage Hygiene (Scenario 8.1)', () => {
    it('validates and normalizes banner input fields', () => {
      const normalized = normalizeBannerInput({
        title: '  Ofertas de Temporada  ',
        subtitle: '  Hasta 30% OFF  ',
        image_url: 'https://cdn.example.com/banners/hero.webp',
        storage_path: 'banners/hero.webp',
        link_url: ' /catalogo ',
        cta_text: ' Ver Catálogo ',
        display_order: 2,
        is_active: true,
      })

      assert.equal(normalized.title, 'Ofertas de Temporada')
      assert.equal(normalized.subtitle, 'Hasta 30% OFF')
      assert.equal(normalized.link_url, '/catalogo')
      assert.equal(normalized.cta_text, 'Ver Catálogo')
      assert.equal(normalized.display_order, 2)
      assert.equal(normalized.is_active, true)

      assert.throws(
        () =>
          normalizeBannerInput({
            title: '   ',
            image_url: 'https://cdn.example.com/banners/hero.webp',
            storage_path: 'banners/hero.webp',
          }),
        /título.*obligatorio/i
      )
    })

    it('Scenario 8.1: deletes old storage_path from catalog-media when banner image is replaced', async () => {
      const deletedPaths: string[] = []

      const updated = await updateBannerService(
        'banner-1',
        {
          title: 'Nueva Colección Primavera',
          subtitle: 'Bazar y regalería',
          image_url: 'https://cdn.example.com/banners/new-hero.webp',
          storage_path: 'banners/new-hero.webp',
          link_url: '/catalogo',
          cta_text: 'Ver todo',
          display_order: 0,
          is_active: true,
        },
        {
          getById: async () => sampleBanner,
          updateRow: async (id, patch) => ({
            ...sampleBanner,
            ...patch,
            id,
          }),
          deleteFiles: async (paths) => {
            const list = Array.isArray(paths) ? paths : paths ? [paths] : []
            deletedPaths.push(...list)
            return { deletedPaths: list }
          },
        }
      )

      assert.equal(updated.storage_path, 'banners/new-hero.webp')
      assert.deepEqual(deletedPaths, ['banners/old-hero.webp'])
    })

    it('rolls back newly uploaded banner WebP on create failure and cleans storage on banner deletion', async () => {
      const rolledBackPaths: string[] = []

      await assert.rejects(
        async () => {
          await createBannerService(
            {
              title: 'Banner Fallido',
              image_url: 'https://cdn.example.com/banners/orphan.webp',
              storage_path: 'banners/orphan.webp',
            },
            {
              insertRow: async () => {
                throw new Error('DB insert error')
              },
              deleteFiles: async (paths) => {
                const list = Array.isArray(paths) ? paths : paths ? [paths] : []
                rolledBackPaths.push(...list)
                return { deletedPaths: list }
              },
            }
          )
        },
        /DB insert error/
      )
      assert.deepEqual(rolledBackPaths, ['banners/orphan.webp'])

      const deletedOnRemove: string[] = []
      const deleteResult = await deleteBannerService('banner-1', {
        getById: async () => sampleBanner,
        deleteRow: async () => undefined,
        deleteFiles: async (paths) => {
          const list = Array.isArray(paths) ? paths : paths ? [paths] : []
          deletedOnRemove.push(...list)
          return { deletedPaths: list }
        },
      })

      assert.equal(deleteResult.deletedId, 'banner-1')
      assert.deepEqual(deletedOnRemove, ['banners/old-hero.webp'])
    })
  })

  describe('REQ-HOME-02 & REQ-HOME-03: Parallel Dynamic Home Aggregator, Showcase Fallback & LCP Hero (Scenario 8.2)', () => {
    it('Scenario 8.2: resolves an editorial fallback hero linking to /catalogo when zero active banners exist, and sets priority + sizes="100vw" on first slide', () => {
      const fallbackSlides = resolveHeroSlides([])
      assert.equal(fallbackSlides.length, 1)
      assert.equal(fallbackSlides[0].isFallback, true)
      assert.equal(fallbackSlides[0].link_url, '/catalogo')
      assert.equal(fallbackSlides[0].isPriority, true)
      assert.equal(fallbackSlides[0].sizes, '100vw')

      const activeSlides = resolveHeroSlides([
        { ...sampleBanner, id: 'b-2', display_order: 2 },
        { ...sampleBanner, id: 'b-1', display_order: 1 },
      ])
      assert.equal(activeSlides.length, 2)
      assert.equal(activeSlides[0].id, 'b-1')
      assert.equal(activeSlides[0].isPriority, true)
      assert.equal(activeSlides[0].sizes, '100vw')
      assert.equal(activeSlides[1].id, 'b-2')
      assert.equal(activeSlides[1].isPriority, false)
    })

    it('loads banners, categories, new arrivals, and showcase concurrently via Promise.all and falls back when showcase RPC is unavailable', async () => {
      const sampleProduct: ProductWithRelations = {
        id: 'prod-1',
        category_id: 'cat-1',
        name: 'Set Tetera Hierro Fundido',
        slug: 'set-tetera-hierro-fundido',
        description: 'Tetera japonesa con infusor de acero inoxidable',
        base_price: 42000,
        compare_at_price: 50000,
        status: 'active',
        is_featured: true,
        created_at: '2026-10-19T12:00:00.000Z',
        updated_at: '2026-10-19T12:00:00.000Z',
        category: {
          id: 'cat-1',
          name: 'Bazar Oriental',
          slug: 'bazar-oriental',
          description: null,
          parent_id: null,
          image_url: null,
          storage_path: null,
          is_active: true,
          display_order: 0,
          created_at: '2026-10-10T00:00:00.000Z',
          updated_at: '2026-10-10T00:00:00.000Z',
        },
        variants: [
          {
            id: 'v-1',
            product_id: 'prod-1',
            sku: 'TET-01',
            name: 'Negra 800ml',
            size: '800ml',
            color: 'Negro',
            dimensions: null,
            price_override: null,
            stock_quantity: 6,
            min_stock_alert: 2,
            image_id: null,
            is_active: true,
            created_at: '2026-10-19T12:00:00.000Z',
            updated_at: '2026-10-19T12:00:00.000Z',
          },
        ],
        images: [
          {
            id: 'img-1',
            product_id: 'prod-1',
            variant_id: null,
            url: 'https://cdn.example.com/products/tetera-1.webp',
            storage_path: 'products/tetera-1.webp',
            alt_text: 'Tetera principal',
            display_order: 0,
            is_primary: true,
            created_at: '2026-10-19T12:00:00.000Z',
          },
          {
            id: 'img-2',
            product_id: 'prod-1',
            variant_id: null,
            url: 'https://cdn.example.com/products/tetera-2.webp',
            storage_path: 'products/tetera-2.webp',
            alt_text: 'Tetera detalle',
            display_order: 1,
            is_primary: false,
            created_at: '2026-10-19T12:00:00.000Z',
          },
        ],
      }

      const mappedItem: ShowcaseProductItem =
        mapProductWithRelationsToShowcaseItem(sampleProduct)
      assert.equal(mappedItem.id, 'prod-1')
      assert.equal(
        mappedItem.primary_image_url,
        'https://cdn.example.com/products/tetera-1.webp'
      )
      assert.equal(
        mappedItem.secondary_image_url,
        'https://cdn.example.com/products/tetera-2.webp'
      )
      assert.equal(mappedItem.total_stock, 6)
      assert.equal(mappedItem.category_slug, 'bazar-oriental')

      const homeData = await getDynamicHomeDataService({
        fetchActiveBanners: async () => [sampleBanner],
        fetchActiveCategories: async () =>
          [sampleProduct.category!] as CategoryRow[],
        fetchRecentActiveProducts: async () => [mappedItem],
        fetchShowcaseRpc: async () => null, // Simulate undeployed RPC
      })

      assert.equal(homeData.banners.length, 1)
      assert.equal(homeData.categories.length, 1)
      assert.equal(homeData.newArrivals.length, 1)
      assert.equal(homeData.showcaseProducts.length, 1)
      assert.equal(
        homeData.showcaseProducts[0].slug,
        'set-tetera-hierro-fundido'
      )
    })
  })
})
