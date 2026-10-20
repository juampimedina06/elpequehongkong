'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getAuthenticatedAdmin,
  type MinimalAuthUserClient,
} from '@/actions/auth/get-user'
import {
  deleteCatalogFiles,
  uploadCatalogImage,
  type CatalogMediaFolder,
  type MinimalStorageBucketClient,
  type UploadedMediaResult,
} from '@/services/storage.service'

export type StorageActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function deleteCatalogMediaFiles(
  storagePaths: string | string[] | null | undefined,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<StorageActionResult<{ deletedPaths: string[] }>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ?? ((await createClient()) as unknown as MinimalStorageBucketClient)

    const result = await deleteCatalogFiles(storagePaths, storageClient)
    return {
      success: true,
      data: result,
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'No se pudieron eliminar los archivos de almacenamiento.'
    return {
      success: false,
      error: message,
    }
  }
}

export async function uploadCatalogMediaAction(
  formData: FormData,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<StorageActionResult<UploadedMediaResult>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const file = formData.get('file')
    const rawFolder = String(formData.get('folder') ?? 'products')
    const folder: CatalogMediaFolder =
      rawFolder === 'categories' || rawFolder === 'banners'
        ? rawFolder
        : 'products'

    if (!(file instanceof File)) {
      return {
        success: false,
        error: 'No se recibió un archivo válido para subir.',
      }
    }

    const storageClient =
      deps?.storageClient ?? ((await createClient()) as unknown as MinimalStorageBucketClient)

    const uploaded = await uploadCatalogImage(file, folder, storageClient)
    return {
      success: true,
      data: uploaded,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error al subir imagen al bucket.'
    return {
      success: false,
      error: message,
    }
  }
}
