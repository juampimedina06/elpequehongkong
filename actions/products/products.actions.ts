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
  bulkUpdateProductPricesService,
  deleteProductService,
  saveProductWithRelationsService,
  updateProductQuickFieldsService,
  type BulkPriceUpdateInput,
  type SaveProductWithRelationsInput,
} from '@/services/products.service'
import type { ProductStatus, ProductWithRelations } from '@/types/database.types'

export type ProductActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

function revalidateProductRoutes(slugs: string[] = []) {
  try {
    revalidatePath('/')
    revalidatePath('/catalogo')
    revalidatePath('/admin')
    revalidatePath('/admin/productos')
    revalidatePath('/admin/stock')
    revalidatePath('/producto/[slug]', 'page')
    for (const slug of slugs) {
      if (slug) {
        revalidatePath(`/producto/${slug}`)
      }
    }
  } catch {
    // Graceful no-op outside Next.js request context
  }
}

export async function saveProductAction(
  input: SaveProductWithRelationsInput,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<ProductActionResult<ProductWithRelations>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const saved = await saveProductWithRelationsService(input, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateProductRoutes([saved.slug])
    return {
      success: true,
      data: saved,
      message: input.id
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el producto.',
    }
  }
}

export async function updateProductQuickFieldsAction(
  id: string,
  patch: {
    base_price?: number
    is_featured?: boolean
    status?: ProductStatus
  },
  deps?: { authClient?: MinimalAuthUserClient }
): Promise<ProductActionResult<ProductWithRelations>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const updated = await updateProductQuickFieldsService(id, patch)
    revalidateProductRoutes([updated.slug])
    return {
      success: true,
      data: updated,
      message: 'Producto actualizado.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el producto.',
    }
  }
}

export async function bulkUpdateProductPricesAction(
  input: BulkPriceUpdateInput,
  deps?: { authClient?: MinimalAuthUserClient }
): Promise<ProductActionResult<{ updatedCount: number; updatedSlugs: string[] }>> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const result = await bulkUpdateProductPricesService(input)
    revalidateProductRoutes(result.updatedSlugs)
    return {
      success: true,
      data: result,
      message: `Se actualizaron los precios de ${result.updatedCount} productos.`,
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudieron actualizar los precios en lote.',
    }
  }
}

export async function deleteProductAction(
  id: string,
  deps?: {
    authClient?: MinimalAuthUserClient
    storageClient?: MinimalStorageBucketClient
  }
): Promise<
  ProductActionResult<{
    deletedId: string
    deletedSlug: string
    deletedStoragePaths: string[]
  }>
> {
  try {
    await getAuthenticatedAdmin(deps?.authClient)
    const storageClient =
      deps?.storageClient ??
      ((await createClient()) as unknown as MinimalStorageBucketClient)

    const deleted = await deleteProductService(id, {
      deleteFiles: (paths) => deleteCatalogFiles(paths, storageClient),
    })
    revalidateProductRoutes([deleted.deletedSlug])
    return {
      success: true,
      data: deleted,
      message: 'Producto y galería eliminados correctamente.',
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el producto.',
    }
  }
}
