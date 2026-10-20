'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategoryAction } from '@/actions/categories/categories.actions'
import { CategoryFormModal } from '@/components/admin/CategoryFormModal'
import type { CategoryWithCountRow } from '@/types/database.types'

interface CategoriesTableProps {
  initialCategories: CategoryWithCountRow[]
}

export function CategoriesTable({ initialCategories }: CategoriesTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithCountRow | null>(null)
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryWithCountRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const filteredCategories = initialCategories.filter((cat) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      (cat.parent_name ?? '').toLowerCase().includes(q)
    )
  })

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (category: CategoryWithCountRow) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    setIsDeleting(true)
    setFeedbackError(null)

    try {
      const res = await deleteCategoryAction(deletingCategory.id)
      if (!res.success) {
        setFeedbackError(res.error)
        return
      }
      setDeletingCategory(null)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex-1 max-w-sm">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, slug o categoría padre..."
            className="w-full rounded-lg border border-zinc-300 bg-[#fafafa] px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {feedbackError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {feedbackError}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-900">
              No se encontraron categorías registradas.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Creá la primera categoría o subcategoría para estructurar tu catálogo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#fafafa] text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-4">Imagen</th>
                  <th className="py-3 px-4">Categoría / Slug</th>
                  <th className="py-3 px-4">Categoría Padre</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 px-4">Orden</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-zinc-50/80 transition-colors"
                  >
                    <td className="py-3 px-4">
                      {category.image_url ? (
                        <div className="h-10 w-10 overflow-hidden rounded-md border border-zinc-200 bg-[#fafafa]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-[#fafafa] text-[10px] font-mono text-zinc-400">
                          —
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">
                        {category.name}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        /{category.slug}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-700">
                      {category.parent_name ? (
                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                          {category.parent_name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          Principal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-md border border-zinc-200 bg-[#fafafa] px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-800">
                        {category.products_count} prod.
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600">
                      #{category.display_order}
                    </td>
                    <td className="py-3 px-4">
                      {category.is_active ? (
                        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                          Oculta
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => router.refresh()}
        editingCategory={editingCategory}
        availableCategories={initialCategories}
      />

      {/* Modal de Confirmación de Eliminación con Advertencia de Productos Asociados */}
      {deletingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de categoría"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[1px]"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-red-600">
                Eliminación Segura
              </p>
              <h3 className="text-base font-semibold text-zinc-900 mt-0.5">
                ¿Eliminar la categoría &ldquo;{deletingCategory.name}&rdquo;?
              </h3>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Impacto en productos asociados ({deletingCategory.products_count}):
              </p>
              <p>
                Actualmente hay{' '}
                <strong>{deletingCategory.products_count}</strong>{' '}
                {deletingCategory.products_count === 1
                  ? 'producto asociado'
                  : 'productos asociados'}{' '}
                a esta categoría. Si confirmás, quedarán marcados como{' '}
                <strong>&ldquo;Sin categoría&rdquo;</strong> (`category_id = NULL`) sin eliminarse del catálogo.
              </p>
              {deletingCategory.storage_path && (
                <p className="pt-1 text-[11px] text-amber-800">
                  También se eliminará físicamente la imagen{' '}
                  <code className="font-mono">{deletingCategory.storage_path}</code>{' '}
                  del bucket <code className="font-mono">catalog-media</code>.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar y Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
