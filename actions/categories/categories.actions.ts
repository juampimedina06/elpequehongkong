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
  createCategoryService,
  deleteCategoryService,
  updateCategoryService,
  type CategoryMutationInput,
  type DeleteCategoryResult,
} from '@/services/categories.service'
import type { CategoryRow } from '@/types/database.types'

export type CategoryActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

function revalidateCategoryRoutes() {
  try {
    revalidatePath('/', 'layout')
    revalidatePath('/admin/categorias')
    revalidatePath('/admin/productos')
    revalidatePath('/catalogo')
  } catch {
    // Graceful no-op when executed outside Next.js request context (e.g., unit tests)
  }
}

export async function createCategoryAction(
  input: CategoryMutationInput,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<CategoryActionResult<CategoryRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const created = await createCategoryService(input, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateCategoryRoutes()
    return {
      success: true,
      data: created,
      message: 'Categoría creada correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo crear la categoría.',
    }
  }
}

export async function updateCategoryAction(
  id: string,
  input: CategoryMutationInput,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<CategoryActionResult<CategoryRow>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const updated = await updateCategoryService(id, input, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateCategoryRoutes()
    return {
      success: true,
      data: updated,
      message: 'Categoría actualizada correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar la categoría.',
    }
  }
}

export async function deleteCategoryAction(
  id: string,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<CategoryActionResult<DeleteCategoryResult>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const deleted = await deleteCategoryService(id, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateCategoryRoutes()
    return {
      success: true,
      data: deleted,
      message: 'Categoría eliminada correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar la categoría.',
    }
  }
}
