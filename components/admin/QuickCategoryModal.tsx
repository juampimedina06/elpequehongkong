'use client'

import { useState, type FormEvent } from 'react'
import { slugify } from '@/utils/formatters'
import { createCategoryAction } from '@/actions/categories/categories.actions'
import type { CategoryRow } from '@/types/database.types'
import { FolderPlus, X } from 'lucide-react'

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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-zinc-950/50 p-0 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <FolderPlus className="size-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Nueva Categoría Rápida
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bazar Oriental, Decoración..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              ¿Es subcategoría de otra? <span className="font-normal text-zinc-400">(Opcional)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="">— No, es una categoría principal —</option>
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
              className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition shadow-sm"
            >
              {isSaving ? 'Creando...' : 'Crear y Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
