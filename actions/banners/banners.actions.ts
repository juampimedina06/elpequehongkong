'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthenticatedAdmin,
  type MinimalAuthUserClient,
} from '@/actions/auth/get-user'
import {
  deleteCatalogFiles,
  type MinimalStorageBucketClient,
} from '@/services/storage.service'
import {
  createBannerService,
  deleteBannerService,
  toggleBannerActiveService,
  updateBannerService,
  type BannerMutationInput,
} from '@/services/banners.service'
import type { HomeBannerRow } from '@/types/database.types'

export type BannerActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

function revalidateBannerRoutes() {
  try {
    revalidatePath('/')
    revalidatePath('/admin/portada')
    revalidatePath('/admin')
  } catch {
    // Graceful no-op outside Next.js request context
  }
}

export async function createBannerAction(
  input: BannerMutationInput,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<BannerActionResult<HomeBannerRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const created = await createBannerService(input, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateBannerRoutes()
    return {
      success: true,
      data: created,
      message: 'Banner creado y publicado correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo crear el banner de portada.',
    }
  }
}

export async function updateBannerAction(
  id: string,
  input: BannerMutationInput,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<BannerActionResult<HomeBannerRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const updated = await updateBannerService(id, input, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateBannerRoutes()
    return {
      success: true,
      data: updated,
      message: 'Banner actualizado correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el banner de portada.',
    }
  }
}

export async function toggleBannerActiveAction(
  id: string,
  isActive: boolean,
  deps?: { authClient?: MinimalAuthUserClient }
): Promise<BannerActionResult<HomeBannerRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const updated = await toggleBannerActiveService(id, isActive)
    revalidateBannerRoutes()
    return {
      success: true,
      data: updated,
      message: isActive ? 'Banner activado.' : 'Banner ocultado.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar el estado del banner.',
    }
  }
}

export async function deleteBannerAction(
  id: string,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<
  BannerActionResult<{ deletedId: string; deletedStoragePath: string | null }>
> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const deleted = await deleteBannerService(id, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateBannerRoutes()
    return {
      success: true,
      data: deleted,
      message: 'Banner e imagen eliminados de Storage correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el banner.',
    }
  }
}
