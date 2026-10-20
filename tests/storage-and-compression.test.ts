import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  compressImageToWebP,
  calculateTargetDimensions,
  resolveQualitySteps,
  toWebPFileName,
  DEFAULT_COMPRESSION_OPTIONS,
} from '../lib/image-compression'
import { compressImageToWebP as reExportedCompressor } from '../utils/compressImage'
import {
  CATALOG_MEDIA_BUCKET,
  buildStoragePath,
  normalizeStoragePaths,
  uploadCatalogImage,
  deleteCatalogFiles,
} from '../services/storage.service'
import { deleteCatalogMediaFiles } from '../actions/storage/storage.actions'

describe('Work Unit 3 (TICKET-03): WebP Compression & catalog-media Storage Hygiene', () => {
  describe('REQ-MEDIA-01: Adaptive Client-Side WebP Compression (Scenario 3.1)', () => {
    it('exports compressImageToWebP from both lib/image-compression and utils/compressImage with strict defaults', () => {
      assert.equal(typeof compressImageToWebP, 'function')
      assert.equal(compressImageToWebP, reExportedCompressor)
      assert.deepEqual(DEFAULT_COMPRESSION_OPTIONS, {
        maxWidth: 1200,
        quality: 0.8,
        maxSizeKB: 150,
      })
    })

    it('calculates proportional target dimensions capped at maxWidth = 1200 (Scenario 3.1)', () => {
      // 3000x2000 -> 1200x800
      assert.deepEqual(calculateTargetDimensions(3000, 2000, 1200), {
        width: 1200,
        height: 800,
      })
      // Smaller than 1200 -> preserved without upscaling
      assert.deepEqual(calculateTargetDimensions(800, 600, 1200), {
        width: 800,
        height: 600,
      })
      // Portrait 2400x3600 -> 1200x1800
      assert.deepEqual(calculateTargetDimensions(2400, 3600, 1200), {
        width: 1200,
        height: 1800,
      })
    })

    it('steps down quality iteratively (0.80 -> 0.72 -> 0.65) when initial pass exceeds 150 KB (Scenario 3.1)', async () => {
      const steps = resolveQualitySteps(0.8)
      assert.deepEqual(steps.slice(0, 3), [0.8, 0.72, 0.65])
      assert.equal(toWebPFileName('Foto Producto Dragón (1).PNG'), 'foto-producto-dragon-1.webp')

      // Simulate a 3.5 MB 3000x2000 PNG where 0.80 produces 210 KB, 0.72 produces 165 KB, and 0.65 produces 118 KB
      const attemptedQualities: number[] = []
      const rawLargeFile = new File(
        [new Uint8Array(3500 * 1024)],
        'Banner Principal 2026.png',
        { type: 'image/png' }
      )

      const compressed = await compressImageToWebP(rawLargeFile, {
        maxWidth: 1200,
        quality: 0.8,
        maxSizeKB: 150,
        encodePassOverride: async ({ width, height, quality }) => {
          attemptedQualities.push(quality)
          assert.equal(width, 1200)
          assert.equal(height, 800)
          if (quality >= 0.8) return new Uint8Array(210 * 1024)
          if (quality >= 0.72) return new Uint8Array(165 * 1024)
          return new Uint8Array(118 * 1024)
        },
        sourceDimensionsOverride: { width: 3000, height: 2000 },
      })

      assert.deepEqual(attemptedQualities, [0.8, 0.72, 0.65])
      assert.equal(compressed.type, 'image/webp')
      assert.equal(compressed.name, 'banner-principal-2026.webp')
      assert.ok(
        compressed.size <= 150 * 1024,
        `Expected compressed size <= 153600 bytes, got ${compressed.size}`
      )
      assert.equal(compressed.size, 118 * 1024)
    })
  })

  describe('REQ-MEDIA-02: Immutable Storage Uploads to catalog-media', () => {
    it('generates sanitized .webp paths and uploads with cacheControl = 31536000', async () => {
      assert.equal(CATALOG_MEDIA_BUCKET, 'catalog-media')

      const pathProducts = buildStoragePath('products', 'Muñeco Dorado #1.png')
      assert.match(pathProducts, /^products\/\d+-[a-z0-9-]+-muneco-dorado-1\.webp$/)

      const pathCategories = buildStoragePath('categories', 'Bazar & Cocina.jpg')
      assert.match(pathCategories, /^categories\/\d+-[a-z0-9-]+-bazar-cocina\.webp$/)

      let capturedBucket = ''
      let capturedPath = ''
      let capturedOptions: Record<string, unknown> = {}

      const mockClient = {
        storage: {
          from(bucket: string) {
            capturedBucket = bucket
            return {
              async upload(path: string, _file: File | Blob, options: Record<string, unknown>) {
                capturedPath = path
                capturedOptions = options
                return { data: { path }, error: null }
              },
              getPublicUrl(path: string) {
                return {
                  data: {
                    publicUrl: `https://demo.supabase.co/storage/v1/object/public/catalog-media/${path}`,
                  },
                }
              },
              async remove() {
                return { data: [], error: null }
              },
            }
          },
        },
      }

      const webpFile = new File([new Uint8Array(95 * 1024)], 'taza-oriental.webp', {
        type: 'image/webp',
      })

      const uploaded = await uploadCatalogImage(webpFile, 'products', mockClient)
      assert.equal(capturedBucket, 'catalog-media')
      assert.match(capturedPath, /^products\/\d+-[a-z0-9-]+-taza-oriental\.webp$/)
      assert.equal(capturedOptions.cacheControl, '31536000')
      assert.equal(capturedOptions.contentType, 'image/webp')
      assert.equal(capturedOptions.upsert, false)
      assert.equal(uploaded.storage_path, capturedPath)
      assert.equal(uploaded.size_bytes, 95 * 1024)
      assert.equal(
        uploaded.url,
        `https://demo.supabase.co/storage/v1/object/public/catalog-media/${capturedPath}`
      )
    })
  })

  describe('REQ-MEDIA-03: Physical Storage Cleanup (Scenario 3.2)', () => {
    it('filters blank/duplicate paths and physically removes valid storage_path entries from catalog-media', async () => {
      const normalized = normalizeStoragePaths([
        'banners/171000-uuid.webp',
        '',
        '   ',
        'banners/171000-uuid.webp',
        '/products/item-2.webp',
        'catalog-media/products/item-3.webp',
        'https://demo.supabase.co/storage/v1/object/public/catalog-media/products/item-4.webp?v=123#hash',
      ])
      assert.deepEqual(normalized, [
        'banners/171000-uuid.webp',
        'products/item-2.webp',
        'products/item-3.webp',
        'products/item-4.webp',
      ])

      const removedBatches: string[][] = []
      const mockStorageClient = {
        storage: {
          from(bucket: string) {
            assert.equal(bucket, 'catalog-media')
            return {
              async upload() {
                return { data: { path: '' }, error: null }
              },
              getPublicUrl(path: string) {
                return { data: { publicUrl: path } }
              },
              async remove(paths: string[]) {
                removedBatches.push(paths)
                return { data: paths, error: null }
              },
            }
          },
        },
      }

      // Scenario 3.2: array containing valid path + empty/whitespace strings
      const deleteResult = await deleteCatalogFiles(
        ['banners/171000-uuid.webp', '', '   '],
        mockStorageClient
      )
      assert.deepEqual(deleteResult.deletedPaths, ['banners/171000-uuid.webp'])
      assert.deepEqual(removedBatches, [['banners/171000-uuid.webp']])

      // Empty input should not invoke storage.remove at all
      const emptyDelete = await deleteCatalogFiles(['', '  '], mockStorageClient)
      assert.deepEqual(emptyDelete.deletedPaths, [])
      assert.equal(removedBatches.length, 1)

      // Server Action deleteCatalogMediaFiles with injected auth + storage client
      const actionRes = await deleteCatalogMediaFiles(
        ['banners/171000-uuid.webp', '', '   '],
        {
          authClient: {
            auth: {
              getUser: async () => ({
                data: { user: { id: 'admin-1', email: 'admin@elpequehongkong.com' } },
                error: null,
              }),
            },
          },
          storageClient: mockStorageClient,
        }
      )
      assert.equal(actionRes.success, true)
      if (actionRes.success) {
        assert.deepEqual(actionRes.data.deletedPaths, ['banners/171000-uuid.webp'])
      }
    })
  })
})
