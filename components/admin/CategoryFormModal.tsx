'use client'

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { slugify } from '@/utils/formatters'
import { compressImageToWebP } from '@/lib/image-compression'
import { uploadCatalogImage } from '@/services/storage.service'
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/actions/categories/categories.actions'
import type { CategoryRow, CategoryWithCountRow } from '@/types/database.types'

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (category: CategoryRow) => void
  editingCategory: CategoryWithCountRow | null
  availableCategories: CategoryWithCountRow[]
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSaved,
  editingCategory,
  availableCategories,
}: CategoryFormModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [displayOrder, setDisplayOrder] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setErrorMessage(null)
    setSelectedFile(null)
    setPreviewUrl(null)

    if (editingCategory) {
      setName(editingCategory.name)
      setSlug(editingCategory.slug)
      setSlugTouched(true)
      setDescription(editingCategory.description ?? '')
      setParentId(editingCategory.parent_id ?? '')
      setIsActive(editingCategory.is_active)
      setDisplayOrder(editingCategory.display_order ?? 0)
      setImageUrl(editingCategory.image_url)
      setStoragePath(editingCategory.storage_path)
    } else {
      setName('')
      setSlug('')
      setSlugTouched(false)
      setDescription('')
      setParentId('')
      setIsActive(true)
      setDisplayOrder(availableCategories.length + 1)
      setImageUrl(null)
      setStoragePath(null)
    }
  }, [isOpen, editingCategory, availableCategories.length])

  if (!isOpen) return null

  const parentOptions = availableCategories.filter(
    (cat) => !editingCategory || cat.id !== editingCategory.id
  )

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleClearImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setImageUrl(null)
    setStoragePath(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('El nombre de la categoría es obligatorio.')
      return
    }

    if (editingCategory && parentId && parentId === editingCategory.id) {
      setErrorMessage('Una categoría no puede ser categoría padre de sí misma.')
      return
    }

    setIsSubmitting(true)

    try {
      let finalImageUrl = imageUrl
      let finalStoragePath = storagePath

      if (selectedFile) {
        const compressedWebP = await compressImageToWebP(selectedFile, {
          maxWidth: 1200,
          quality: 0.8,
          maxSizeKB: 150,
        })
        const uploaded = await uploadCatalogImage(compressedWebP, 'categories')
        finalImageUrl = uploaded.url
        finalStoragePath = uploaded.storage_path
      }

      const payload = {
        name: name.trim(),
        slug: slugify(slug.trim() || name.trim()),
        description: description.trim() || null,
        parent_id: parentId.trim() || null,
        image_url: finalImageUrl,
        storage_path: finalStoragePath,
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
      }

      const result = editingCategory
        ? await updateCategoryAction(editingCategory.id, payload)
        : await createCategoryAction(payload)

      if (!result.success) {
        setErrorMessage(result.error)
        return
      }

      onSaved(result.data)
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error inesperado al guardar la categoría.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const activePreview = previewUrl || imageUrl

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              Jerarquía de Catálogo
            </p>
            <h2 className="text-base font-semibold text-zinc-900">
              {editingCategory ? 'Editar Categoría' : 'Crear Categoría'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Bazar Oriental"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Slug (URL) *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                placeholder="bazar-oriental"
                className="w-full rounded-lg border border-zinc-300 bg-[#fafafa] px-3 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Categoría Padre (Opcional)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                <option value="">— Categoría Principal (Raíz) —</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Orden de Visualización
              </label>
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-800 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción para encabezados de categoría..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          {/* Subida de imagen comprimida WebP */}
          <div className="rounded-lg border border-zinc-200 bg-[#fafafa] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-900">
                  Imagen de Portada (.webp &lt; 150 KB)
                </p>
                <p className="text-[11px] text-zinc-500">
                  Se comprime automáticamente antes de subir a catalog-media
                </p>
              </div>
              {activePreview && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-[11px] font-medium text-red-600 hover:underline"
                >
                  Quitar imagen
                </button>
              )}
            </div>

            {activePreview && (
              <div className="relative h-28 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreview}
                  alt={name || 'Vista previa de categoría'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-800 hover:file:bg-zinc-50"
            />
          </div>

          <label className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2.5 cursor-pointer">
            <div>
              <span className="text-xs font-medium text-zinc-900">
                Categoría Activa
              </span>
              <p className="text-[11px] text-zinc-500">
                Visible en la barra de navegación y filtros del catálogo público
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : editingCategory
                ? 'Guardar Cambios'
                : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
