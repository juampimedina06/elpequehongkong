'use client'

import { useState, type FormEvent } from 'react'
import { slugify } from '@/utils/formatters'
import { createCategoryAction } from '@/actions/categories/categories.actions'
import type { CategoryRow } from '@/types/database.types'

interface QuickCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (newCategory: CategoryRow) => void
  existingCategories: CategoryRow[]
}

export function QuickCategoryModal({
  isOpen,
  onClose,
  onCreated,
  existingCategories,
}: QuickCategoryModalProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Ingresá el nombre de la categoría.')
      return
    }

    setIsSaving(true)
    try {
      const res = await createCategoryAction({
        name: name.trim(),
        slug: slugify(name.trim()),
        parent_id: parentId.trim() || null,
        is_active: true,
        display_order: existingCategories.length + 1,
      })

      if (!res.success) {
        setErrorMessage(res.error)
        return
      }

      setName('')
      setParentId('')
      onCreated(res.data)
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo crear la categoría rápida.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crear categoría rápida"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Creación Inline
            </p>
            <h3 className="text-sm font-semibold text-zinc-900">
              Nueva Categoría Rápida
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-800 mb-1">
              Nombre de Categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Decoración Oriental"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
            {name.trim() && (
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                Slug: /{slugify(name)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-800 mb-1">
              Categoría Padre (Opcional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="">— Categoría Principal —</option>
              {existingCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSaving ? 'Creando...' : 'Crear y Seleccionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
