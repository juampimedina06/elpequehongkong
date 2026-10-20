import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateCategoryHierarchy,
  normalizeCategoryInput,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getCategoriesWithCountService,
} from '../services/categories.service'
import type { CategoryRow, CategoryWithCountRow } from '../types/database.types'

function buildSampleCategory(overrides?: Partial<CategoryWithCountRow>): CategoryWithCountRow {
  return {
    id: 'cat-1',
    name: 'Bazar Oriental',
    slug: 'bazar-oriental',
    description: 'Vajilla, tazas y cuencos orientales',
    parent_id: null,
    image_url: 'https://demo.supabase.co/storage/v1/object/public/catalog-media/categories/bazar.webp',
    storage_path: 'categories/bazar.webp',
    is_active: true,
    display_order: 1,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    products_count: 8,
    parent_name: null,
    ...overrides,
  }
}

describe('Work Unit 5 (TICKET-05): Hierarchical Categories CRUD & Storage Cleanup', () => {
  describe('REQ-CAT-01: Hierarchical Listing with View & Fallback', () => {
    it('lists categories from categories_with_count and resolves parent_name', async () => {
      const rows: CategoryWithCountRow[] = [
        buildSampleCategory({ id: 'cat-1', name: 'Bazar Oriental', products_count: 8 }),
        buildSampleCategory({
          id: 'cat-2',
          name: 'Tazas de Cerámica',
          slug: 'tazas-de-ceramica',
          parent_id: 'cat-1',
          products_count: 5,
          display_order: 2,
        }),
      ]

      const result = await getCategoriesWithCountService({
        listWithCount: async () => rows,
      })

      assert.equal(result.length, 2)
      assert.equal(result[0].name, 'Bazar Oriental')
      assert.equal(result[0].parent_name, null)
      assert.equal(result[1].name, 'Tazas de Cerámica')
      assert.equal(result[1].parent_name, 'Bazar Oriental')
      assert.equal(result[1].products_count, 5)
    })
  })

  describe('REQ-CAT-02: Cycle Prevention & Media Replacement (Scenario 5.1)', () => {
    it('Scenario 5.1: rejects self-parenting (parent_id === id) and ancestor cycles without mutating DB', async () => {
      const existingCategories: Array<Pick<CategoryRow, 'id' | 'parent_id'>> = [
        { id: 'cat-123', parent_id: null },
        { id: 'cat-child', parent_id: 'cat-123' },
      ]

      // Direct self-parenting cycle
      assert.throws(
        () => validateCategoryHierarchy('cat-123', 'cat-123', existingCategories),
        /no puede ser categoría padre de sí misma/i
      )

      // Indirect cycle: cat-123 cannot have its own child (cat-child) as parent
      assert.throws(
        () => validateCategoryHierarchy('cat-123', 'cat-child', existingCategories),
        /ciclo jerárquico/i
      )

      // Service-level update must reject self-parenting before touching repository update
      let dbUpdateCalled = false
      await assert.rejects(
        async () => {
          await updateCategoryService(
            'cat-123',
            {
              name: 'Bazar Oriental',
              slug: 'bazar-oriental',
              parent_id: 'cat-123',
              is_active: true,
              display_order: 1,
            },
            {
              getById: async () => buildSampleCategory({ id: 'cat-123' }),
              listAllMinimal: async () => existingCategories,
              updateRow: async () => {
                dbUpdateCalled = true
                return buildSampleCategory({ id: 'cat-123' })
              },
              deleteFiles: async () => ({ deletedPaths: [] }),
            }
          )
        },
        /no puede ser categoría padre de sí misma/i
      )
      assert.equal(dbUpdateCalled, false)
    })

    it('auto-generates normalized slug from name and deletes old storage_path when image is replaced', async () => {
      const normalized = normalizeCategoryInput({
        name: '  Lámparas & Faroles Chinos! ',
        slug: '',
        parent_id: '',
        is_active: true,
        display_order: 3,
      })

      assert.equal(normalized.name, 'Lámparas & Faroles Chinos!')
      assert.equal(normalized.slug, 'lamparas-faroles-chinos')
      assert.equal(normalized.parent_id, null)

      const deletedStoragePaths: string[][] = []
      const updated = await updateCategoryService(
        'cat-1',
        {
          name: 'Bazar Oriental Renovado',
          slug: 'bazar-oriental-renovado',
          image_url: 'https://demo.supabase.co/storage/v1/object/public/catalog-media/categories/new-bazar.webp',
          storage_path: 'categories/new-bazar.webp',
          is_active: true,
          display_order: 1,
        },
        {
          getById: async () =>
            buildSampleCategory({
              id: 'cat-1',
              storage_path: 'categories/old-bazar.webp',
            }),
          listAllMinimal: async () => [{ id: 'cat-1', parent_id: null }],
          updateRow: async (_id, payload) =>
            buildSampleCategory({
              id: 'cat-1',
              name: payload.name ?? 'Bazar Oriental Renovado',
              slug: payload.slug ?? 'bazar-oriental-renovado',
              image_url: payload.image_url ?? null,
              storage_path: payload.storage_path ?? null,
            }),
          deleteFiles: async (paths) => {
            const list = Array.isArray(paths) ? paths : paths ? [paths] : []
            deletedStoragePaths.push(list)
            return { deletedPaths: list }
          },
        }
      )

      assert.equal(updated.storage_path, 'categories/new-bazar.webp')
      assert.deepEqual(deletedStoragePaths, [['categories/old-bazar.webp']])
    })

    it('rolls back newly uploaded image from catalog-media if category creation fails in DB', async () => {
      const rolledBackPaths: string[][] = []

      await assert.rejects(
        async () => {
          await createCategoryService(
            {
              name: 'Regalería',
              slug: 'regaleria',
              image_url: 'https://demo.supabase.co/categories/regaleria-temp.webp',
              storage_path: 'categories/regaleria-temp.webp',
            },
            {
              insertRow: async () => {
                throw new Error('duplicate key value violates unique constraint "categories_slug_key"')
              },
              deleteFiles: async (paths) => {
                const list = Array.isArray(paths) ? paths : paths ? [paths] : []
                rolledBackPaths.push(list)
                return { deletedPaths: list }
              },
            }
          )
        },
        /duplicate key/i
      )

      assert.deepEqual(rolledBackPaths, [['categories/regaleria-temp.webp']])
    })
  })

  describe('REQ-CAT-03: Safe Category Deletion with Storage Cleanup & Product Count (Scenario 5.2)', () => {
    it('Scenario 5.2: deletes category storage_path from catalog-media and returns affected products_count', async () => {
      const deletedStoragePaths: string[][] = []
      let deletedCategoryId = ''

      const result = await deleteCategoryService('cat-1', {
        getByIdWithCount: async () =>
          buildSampleCategory({
            id: 'cat-1',
            name: 'Bazar Oriental',
            products_count: 8,
            storage_path: 'categories/bazar.webp',
          }),
        deleteRow: async (id) => {
          deletedCategoryId = id
        },
        deleteFiles: async (paths) => {
          const list = Array.isArray(paths) ? paths : paths ? [paths] : []
          deletedStoragePaths.push(list)
          return { deletedPaths: list }
        },
      })

      assert.equal(deletedCategoryId, 'cat-1')
      assert.deepEqual(deletedStoragePaths, [['categories/bazar.webp']])
      assert.equal(result.deletedId, 'cat-1')
      assert.equal(result.affectedProductsCount, 8)
      assert.equal(result.deletedStoragePath, 'categories/bazar.webp')
    })
  })
})
