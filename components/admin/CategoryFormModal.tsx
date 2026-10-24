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
import { Camera, ChevronDown, ChevronUp, FolderPlus, Trash2, X } from 'lucide-react'

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
  const [showImageSection, setShowImageSection] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
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
      setShowImageSection(Boolean(editingCategory.image_url))
      setShowAdvancedOptions(Boolean(editingCategory.description))
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
      setShowImageSection(false)
      setShowAdvancedOptions(false)
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
      setErrorMessage('Por favor, ingresá el nombre de la categoría.')
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
          maxWidth: 600,
          quality: 0.75,
          maxSizeKB: 60,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Cabecera amigable */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
              <FolderPlus className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 leading-tight">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-xs text-zinc-500">
                {editingCategory
                  ? 'Modificá los datos de esta categoría'
                  : 'Creá una sección para ordenar tus productos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formulario scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2"
            >
              <span className="font-semibold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre de la categoría */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Bazar, Decoración, Termos..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            />
            {name.trim() && (
              <p className="mt-1 text-[11px] text-zinc-500">
                Enlace web: <span className="font-mono text-zinc-700">/{slug || slugify(name)}</span>
              </p>
            )}
          </div>

          {/* Categoría Padre */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              ¿Es una subcategoría de otra? <span className="text-zinc-400 font-normal">(Opcional)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition"
            >
              <option value="">— No, es una categoría principal —</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  Depende de: {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              Dejá la opción por defecto si querés que aparezca como categoría principal en el menú.
            </p>
          </div>

          {/* Switch Categoría Activa */}
          <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 cursor-pointer hover:bg-zinc-50 transition">
            <div className="pr-3">
              <span className="text-xs font-semibold text-zinc-900">
                Mostrar en la tienda
              </span>
              <p className="text-[11px] text-zinc-500">
                Si está activa, los clientes podrán verla y filtrar productos en ella.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
            />
          </label>

          {/* Sección de Foto Opcional (No se pide por defecto al crear) */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowImageSection((prev) => !prev)}
              className="w-full flex items-center justify-between p-3.5 bg-zinc-50/70 hover:bg-zinc-100/70 text-left transition"
            >
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-800">
                  Foto de portada <span className="text-zinc-400 font-normal">(Opcional)</span>
                </span>
                {activePreview && (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-medium">
                    Tiene foto
                  </span>
                )}
              </div>
              {showImageSection ? (
                <ChevronUp className="size-4 text-zinc-500" />
              ) : (
                <ChevronDown className="size-4 text-zinc-500" />
              )}
            </button>

            {showImageSection && (
              <div className="p-4 bg-white border-t border-zinc-100 space-y-3">
                <p className="text-xs text-zinc-500">
                  No es obligatoria. Podés dejarla sin foto y la categoría funcionará perfectamente.
                </p>

                {activePreview ? (
                  <div className="space-y-2">
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePreview}
                        alt={name || 'Vista previa'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                    >
                      <Trash2 className="size-3.5" />
                      Quitar foto
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="category-image-input"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-800 hover:file:bg-zinc-50 cursor-pointer"
                    />
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Podés elegir cualquier imagen (JPG, PNG o WebP). Se optimiza automáticamente.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opciones Avanzadas Colapsables */}
          <div className="border-t border-zinc-100 pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium py-1"
            >
              <span>{showAdvancedOptions ? 'Ocultar opciones avanzadas' : 'Ver opciones avanzadas (descripción, orden, enlace)'}</span>
              {showAdvancedOptions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showAdvancedOptions && (
              <div className="mt-3 space-y-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Enlace web personalizado (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true)
                      setSlug(slugify(e.target.value))
                    }}
                    placeholder="ej: bazar-oriental"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Número menor aparece primero en la lista.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve texto sobre los productos de esta categoría..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Botones de acción fijos en la parte inferior */}
        <div className="border-t border-zinc-200 bg-white p-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 active:bg-zinc-950 disabled:opacity-50 transition shadow-sm"
          >
            {isSubmitting
              ? 'Guardando...'
              : editingCategory
              ? 'Guardar Cambios'
              : 'Crear Categoría'}
          </button>
        </div>
      </div>
    </div>
  )
}
