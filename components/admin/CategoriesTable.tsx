'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategoryAction } from '@/actions/categories/categories.actions'
import { CategoryFormModal } from '@/components/admin/CategoryFormModal'
import type { CategoryWithCountRow } from '@/types/database.types'
import {
  Plus,
  Search,
  Folder,
  FolderTree,
  Edit3,
  Trash2,
  Package,
  Layers,
} from 'lucide-react'

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
      {/* Barra de Búsqueda y Botón de Creación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
          />
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-950 transition shadow-sm shrink-0"
        >
          <Plus className="size-4" />
          <span>+ Nueva Categoría</span>
        </button>
      </div>

      {feedbackError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
        >
          {feedbackError}
        </div>
      )}

      {/* Contenido: Cards en Mobile / Tabla en Desktop */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
            <Folder className="size-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">
            No se encontraron categorías.
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No hay ninguna categoría que coincida con tu búsqueda.'
              : 'Creá la primera categoría para empezar a organizar los productos de tu tienda.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition"
            >
              <Plus className="size-3.5" />
              Crear Categoría
            </button>
          )}
        </div>
      ) : (
        <>
          {/* VISTA MOBILE: Tarjetas amigables y táctiles (md:hidden) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {category.image_url ? (
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500">
                        {category.parent_name ? (
                          <FolderTree className="size-5" />
                        ) : (
                          <Folder className="size-5" />
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                        {category.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        /{category.slug}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                      category.is_active
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-zinc-200 bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {category.is_active ? 'Activa' : 'Oculta'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {category.parent_name ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700">
                      <Layers className="size-3 text-zinc-400" />
                      Subcategoría de: {category.parent_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50/80 px-2 py-1 text-[11px] text-zinc-500">
                      Categoría Principal
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700">
                    <Package className="size-3 text-zinc-400" />
                    {category.products_count}{' '}
                    {category.products_count === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                {/* Botones de acción táctiles para celular */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(category)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-800 transition"
                  >
                    <Edit3 className="size-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(category)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition"
                    aria-label={`Eliminar ${category.name}`}
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VISTA DESKTOP: Tabla completa (hidden md:block) */}
          <div className="hidden md:block rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Productos</th>
                    <th className="py-3.5 px-4">Orden</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 text-xs">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-zinc-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {category.image_url ? (
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
                              <Folder className="size-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-900">
                              {category.name}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-400">
                              /{category.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700">
                        {category.parent_name ? (
                          <span className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                            Subcategoría de {category.parent_name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Principal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-800">
                          <Package className="size-3 text-zinc-400" />
                          {category.products_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500">
                        #{category.display_order}
                      </td>
                      <td className="py-3.5 px-4">
                        {category.is_active ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
                            Oculta
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(category)}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCategory(category)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => router.refresh()}
        editingCategory={editingCategory}
        availableCategories={initialCategories}
      />

      {/* Modal de Confirmación de Eliminación amigable */}
      {deletingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de categoría"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-600">
                Eliminar Categoría
              </p>
              <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                ¿Eliminar &ldquo;{deletingCategory.name}&rdquo;?
              </h3>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                ℹ️ ¿Qué pasa con los productos ({deletingCategory.products_count})?
              </p>
              <p>
                Tus productos <strong>no se borrarán</strong>. Si confirmás, seguirán existiendo en tu tienda pero quedarán marcados como <em>&ldquo;Sin categoría&rdquo;</em> para que puedas reasignarlos cuando quieras.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 sm:flex-none rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
