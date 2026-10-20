import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { slugify } from '@/utils/formatters'

export const CATALOG_MEDIA_BUCKET = 'catalog-media' as const
export const IMMUTABLE_CACHE_CONTROL = '31536000' as const

export type CatalogMediaFolder = 'products' | 'categories' | 'banners'

export interface UploadedMediaResult {
  url: string
  storage_path: string
  size_bytes: number
}

export interface MinimalStorageBucketClient {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File | Blob,
        options: {
          cacheControl?: string
          contentType?: string
          upsert?: boolean
        }
      ) => Promise<{
        data: { path: string } | null
        error: { message: string } | null
      }>
      getPublicUrl: (path: string) => {
        data: { publicUrl: string }
      }
      remove: (paths: string[]) => Promise<{
        data: unknown
        error: { message: string } | null
      }>
    }
  }
}

function generateShortUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().split('-')[0]
  }
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Generates an immutable, sanitized storage path inside catalog-media:
 * `{folder}/{timestamp}-{uuid}-{slug}.webp`
 */
export function buildStoragePath(
  folder: CatalogMediaFolder,
  originalFileName: string
): string {
  const withoutExt = originalFileName.replace(/\.[^/.]+$/, '')
  const cleanSlug = slugify(withoutExt) || 'imagen'
  const timestamp = Date.now()
  const uniqueId = generateShortUniqueId()

  return `${folder}/${timestamp}-${uniqueId}-${cleanSlug}.webp`
}

/**
 * Normalizes a single path or array of paths, stripping leading slashes,
 * blank strings, and duplicates.
 */
export function normalizeStoragePaths(
  storagePaths: string | string[] | null | undefined
): string[] {
  if (!storagePaths) return []
  const rawList = Array.isArray(storagePaths) ? storagePaths : [storagePaths]
  const seen = new Set<string>()

  for (const item of rawList) {
    if (typeof item !== 'string') continue
    const cleaned = item.trim().replace(/^\/+/, '')
    if (cleaned.length > 0 && !seen.has(cleaned)) {
      seen.add(cleaned)
    }
  }

  return Array.from(seen)
}

/**
 * Uploads an optimized .webp image to `catalog-media/{folder}` with 1-year
 * immutable cacheControl ('31536000') to protect Supabase Free Tier Egress.
 */
export async function uploadCatalogImage(
  file: File,
  folder: CatalogMediaFolder,
  clientOverride?: MinimalStorageBucketClient
): Promise<UploadedMediaResult> {
  const supabase = clientOverride ?? createBrowserSupabaseClient()
  const storagePath = buildStoragePath(folder, file.name)

  const { error } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: IMMUTABLE_CACHE_CONTROL,
      contentType: 'image/webp',
      upsert: false,
    })

  if (error) {
    throw new Error(`Error al subir imagen a ${CATALOG_MEDIA_BUCKET}: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CATALOG_MEDIA_BUCKET).getPublicUrl(storagePath)

  return {
    url: publicUrl,
    storage_path: storagePath,
    size_bytes: file.size,
  }
}

/**
 * Physically deletes one or multiple files from `catalog-media` by `storage_path`.
 */
export async function deleteCatalogFiles(
  storagePaths: string | string[] | null | undefined,
  clientOverride?: MinimalStorageBucketClient
): Promise<{ deletedPaths: string[] }> {
  const validPaths = normalizeStoragePaths(storagePaths)
  if (validPaths.length === 0) {
    return { deletedPaths: [] }
  }

  const supabase = clientOverride ?? createBrowserSupabaseClient()
  const { error } = await supabase.storage
    .from(CATALOG_MEDIA_BUCKET)
    .remove(validPaths)

  if (error) {
    throw new Error(
      `Error al eliminar archivos de ${CATALOG_MEDIA_BUCKET}: ${error.message}`
    )
  }

  return { deletedPaths: validPaths }
}
