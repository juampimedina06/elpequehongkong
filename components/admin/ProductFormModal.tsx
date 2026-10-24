'use client'

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { slugify } from '@/utils/formatters'
import { compressImageToWebP } from '@/lib/image-compression'
import { uploadCatalogImage } from '@/services/storage.service'
import { deleteCatalogMediaFiles } from '@/actions/storage/storage.actions'
import { saveProductAction } from '@/actions/products/products.actions'
import { QuickCategoryModal } from '@/components/admin/QuickCategoryModal'
import type {
  CategoryRow,
  ProductStatus,
  ProductWithRelations,
} from '@/types/database.types'

interface EditableVariantItem {
  id?: string
  tempKey: string
  name: string
  sku: string
  size: string
  color: string
  dimensions: string
  price_override: string
  stock_quantity: number
  min_stock_alert: number
  is_active: boolean
}

interface EditableGalleryItem {
  id?: string
  tempKey: string
  url: string
  storage_path: string
  alt_text: string
  display_order: number
  is_primary: boolean
  variant_id: string
  isNewlyUploaded: boolean
}

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editingProduct: ProductWithRelations | null
  initialCategories: CategoryRow[]
}

function createEmptyVariant(index: number): EditableVariantItem {
  return {
    tempKey: `var-temp-${Date.now()}-${index}`,
    name: index === 1 ? 'Estándar' : `Variante ${index}`,
    sku: '',
    size: '',
    color: '',
    dimensions: '',
    price_override: '',
    stock_quantity: 0,
    min_stock_alert: 3,
    is_active: true,
  }
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
  initialCategories,
}: ProductFormModalProps) {
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories)
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [status, setStatus] = useState<ProductStatus>('active')
  const [isFeatured, setIsFeatured] = useState(false)

  const [variants, setVariants] = useState<EditableVariantItem[]>([])
  const [gallery, setGallery] = useState<EditableGalleryItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    if (!isOpen) return
    setErrorMessage(null)

    if (editingProduct) {
      setName(editingProduct.name)
      setSlug(editingProduct.slug)
      setSlugTouched(true)
      setCategoryId(editingProduct.category_id ?? '')
      setDescription(editingProduct.description ?? '')
      setBasePrice(String(editingProduct.base_price))
      setCompareAtPrice(
        editingProduct.compare_at_price !== null
          ? String(editingProduct.compare_at_price)
          : ''
      )
      setStatus(editingProduct.status)
      setIsFeatured(editingProduct.is_featured)

      setVariants(
        editingProduct.variants.length > 0
          ? editingProduct.variants.map((v) => ({
              id: v.id,
              tempKey: v.id,
              name: v.name,
              sku: v.sku ?? '',
              size: v.size ?? '',
              color: v.color ?? '',
              dimensions: v.dimensions ?? '',
              price_override:
                v.price_override !== null ? String(v.price_override) : '',
              stock_quantity: v.stock_quantity,
              min_stock_alert: v.min_stock_alert,
              is_active: v.is_active,
            }))
          : [createEmptyVariant(1)]
      )

      setGallery(
        editingProduct.images.map((img, idx) => ({
          id: img.id,
          tempKey: img.id,
          url: img.url,
          storage_path: img.storage_path,
          alt_text: img.alt_text ?? editingProduct.name,
          display_order: idx,
          is_primary: img.is_primary,
          variant_id: img.variant_id ?? '',
          isNewlyUploaded: false,
        }))
      )
    } else {
      setName('')
      setSlug('')
      setSlugTouched(false)
      setCategoryId('')
      setDescription('')
      setBasePrice('')
      setCompareAtPrice('')
      setStatus('active')
      setIsFeatured(false)
      setVariants([createEmptyVariant(1)])
      setGallery([])
    }
  }, [isOpen, editingProduct])

  if (!isOpen) return null

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleCancelAndCleanup = async () => {
    const unsavedNewPaths = gallery
      .filter((img) => img.isNewlyUploaded)
      .map((img) => img.storage_path)

    if (unsavedNewPaths.length > 0) {
      await deleteCatalogMediaFiles(unsavedNewPaths).catch(() => undefined)
    }
    onClose()
  }

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant(prev.length + 1)])
  }

  const handleRemoveVariant = (tempKey: string) => {
    if (variants.length <= 1) return
    setVariants((prev) => prev.filter((v) => v.tempKey !== tempKey))
    setGallery((prev) =>
      prev.map((img) =>
        img.variant_id === tempKey ? { ...img, variant_id: '' } : img
      )
    )
  }

  const handleUpdateVariantField = <K extends keyof EditableVariantItem>(
    tempKey: string,
    field: K,
    value: EditableVariantItem[K]
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.tempKey === tempKey ? { ...v, [field]: value } : v))
    )
  }

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    setIsUploadingImages(true)
    setErrorMessage(null)

    try {
      const filesArray = Array.from(fileList)
      const uploadedItems: EditableGalleryItem[] = []

      for (let i = 0; i < filesArray.length; i++) {
        const rawFile = filesArray[i]
        const compressed = await compressImageToWebP(rawFile, {
          maxWidth: 1000,
          quality: 0.75,
          maxSizeKB: 90,
        })
        const uploaded = await uploadCatalogImage(compressed, 'products')

        uploadedItems.push({
          tempKey: `img-temp-${Date.now()}-${i}`,
          url: uploaded.url,
          storage_path: uploaded.storage_path,
          alt_text: name.trim() || rawFile.name.replace(/\.[^/.]+$/, ''),
          display_order: gallery.length + i,
          is_primary: gallery.length === 0 && i === 0,
          variant_id: '',
          isNewlyUploaded: true,
        })
      }

      setGallery((prev) => {
        const combined = [...prev, ...uploadedItems]
        const hasPrimary = combined.some((item) => item.is_primary)
        return combined.map((item, idx) => ({
          ...item,
          display_order: idx,
          is_primary: hasPrimary ? item.is_primary : idx === 0,
        }))
      })
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error al comprimir o subir las imágenes.'
      )
    } finally {
      setIsUploadingImages(false)
      e.target.value = ''
    }
  }

  const handleRemoveGalleryImage = async (target: EditableGalleryItem) => {
    if (target.isNewlyUploaded && target.storage_path) {
      await deleteCatalogMediaFiles([target.storage_path]).catch(() => undefined)
    }

    setGallery((prev) => {
      const remaining = prev.filter((item) => item.tempKey !== target.tempKey)
      const hasPrimary = remaining.some((item) => item.is_primary)
      return remaining.map((item, idx) => ({
        ...item,
        display_order: idx,
        is_primary: hasPrimary ? item.is_primary : idx === 0,
      }))
    })
  }

  const handleSetPrimaryImage = (tempKey: string) => {
    setGallery((prev) =>
      prev.map((item) => ({
        ...item,
        is_primary: item.tempKey === tempKey,
      }))
    )
  }

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= gallery.length) return

    setGallery((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, moved)
      return copy.map((item, idx) => ({
        ...item,
        display_order: idx,
      }))
    })
  }

  const handleDropImage = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      return
    }
    setGallery((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(draggedIndex, 1)
      copy.splice(targetIndex, 0, moved)
      return copy.map((item, idx) => ({
        ...item,
        display_order: idx,
      }))
    })
    setDraggedIndex(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const numericBasePrice = Number(basePrice)
    if (!name.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.')
      return
    }
    if (!Number.isFinite(numericBasePrice) || numericBasePrice <= 0) {
      setErrorMessage('El precio base debe ser mayor a 0.')
      return
    }

    setIsSubmitting(true)
    try {
      const newlyUploadedStoragePaths = gallery
        .filter((img) => img.isNewlyUploaded)
        .map((img) => img.storage_path)

      const res = await saveProductAction({
        id: editingProduct?.id,
        name: name.trim(),
        slug: slugify(slug.trim() || name.trim()),
        category_id: categoryId.trim() || null,
        description: description.trim() || null,
        base_price: numericBasePrice,
        compare_at_price:
          compareAtPrice.trim() && Number(compareAtPrice) > 0
            ? Number(compareAtPrice)
            : null,
        status,
        is_featured: isFeatured,
        newlyUploadedStoragePaths,
        variants: variants.map((v) => ({
          id: v.id,
          tempKey: v.tempKey,
          name: v.name.trim() || 'Estándar',
          sku: v.sku.trim() || null,
          size: v.size.trim() || null,
          color: v.color.trim() || null,
          dimensions: v.dimensions.trim() || null,
          price_override:
            v.price_override.trim() && Number(v.price_override) > 0
              ? Number(v.price_override)
              : null,
          stock_quantity: Number(v.stock_quantity) || 0,
          min_stock_alert: Number(v.min_stock_alert) || 0,
          is_active: v.is_active,
        })),
        images: gallery.map((img, idx) => ({
          id: img.id,
          url: img.url,
          storage_path: img.storage_path,
          alt_text: img.alt_text.trim() || name.trim(),
          display_order: idx,
          is_primary: img.is_primary,
          variant_id: img.variant_id || null,
          linkedVariantTempKey: img.variant_id || null,
        })),
      })

      if (!res.success) {
        setErrorMessage(res.error)
        return
      }

      onSaved()
      onClose()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error inesperado al guardar producto.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingProduct ? 'Editar Producto' : 'Crear Producto'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-3 sm:p-5 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-4xl rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-white">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              Ficha Técnica, Variantes &amp; Galería WebP
            </p>
            <h2 className="text-base font-semibold text-zinc-900">
              {editingProduct
                ? `Editar Producto: ${editingProduct.name}`
                : 'Nuevo Producto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancelAndCleanup}
            disabled={isSubmitting || isUploadingImages}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cerrar
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-6 overflow-y-auto flex-1"
        >
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* 1. Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-2">
              1. Información General y Precios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-800 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Tetera Hierro Fundido Dragón"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-800 mb-1">
                  Slug SEO (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="tetera-hierro-fundido-dragon"
                  className="w-full rounded-lg border border-zinc-300 bg-[#fafafa] px-3 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-800">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickCategoryOpen(true)}
                    className="text-[11px] font-medium text-zinc-900 underline hover:text-zinc-600"
                  >
                    + Crear categoría rápida
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                >
                  <option value="">— Sin categoría asignada —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-800 mb-1">
                  Estado de Publicación
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                >
                  <option value="active">Activo (Visible)</option>
                  <option value="draft">Borrador (Oculto)</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-800 mb-1">
                  Precio Base (ARS) *
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="Ej: 24500"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-800 mb-1">
                  Precio Tachado / Oferta (Opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Ej: 29900"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <label className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2 cursor-pointer">
                  <span className="text-xs font-medium text-zinc-900">
                    Destacado en Inicio
                  </span>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-800 mb-1">
                Descripción del Producto
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Materiales, origen, recomendaciones de uso y detalles..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Variantes Dinámicas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  2. Variantes, Atributos y Stock ({variants.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Definí talle, color, medidas, SKU, precio diferencial opcional y stock.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                + Agregar Variante
              </button>
            </div>

            <div className="space-y-2.5">
              {variants.map((variant, index) => (
                <div
                  key={variant.tempKey}
                  className="rounded-lg border border-zinc-200 bg-[#fafafa] p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700">
                      Variante #{index + 1}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.tempKey)}
                        className="text-[11px] font-medium text-red-600 hover:underline"
                      >
                        Quitar variante
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.name}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'name',
                            e.target.value
                          )
                        }
                        placeholder="Ej: Azul 500ml"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'sku',
                            e.target.value
                          )
                        }
                        placeholder="TET-001"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Talle
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'size',
                            e.target.value
                          )
                        }
                        placeholder="S / M / L / XL"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Color
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'color',
                            e.target.value
                          )
                        }
                        placeholder="Rojo / Dorado"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Medidas
                      </label>
                      <input
                        type="text"
                        value={variant.dimensions}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'dimensions',
                            e.target.value
                          )
                        }
                        placeholder="20x15 cm"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Precio Propio ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={variant.price_override}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            variant.tempKey,
                            'price_override',
                            e.target.value
                          )
                        }
                        placeholder="Usa base"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                          Stock
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={variant.stock_quantity}
                          onChange={(e) =>
                            handleUpdateVariantField(
                              variant.tempKey,
                              'stock_quantity',
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                          Alerta
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={variant.min_stock_alert}
                          onChange={(e) =>
                            handleUpdateVariantField(
                              variant.tempKey,
                              'min_stock_alert',
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Galería de Fotos WebP Ordenable */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  3. Galería de Imágenes WebP ({gallery.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Subida múltiple con compresión automática &lt; 150 KB, reordenamiento Drag &amp; Drop y asociación a variante.
                </p>
              </div>
              <label className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 cursor-pointer">
                <span>
                  {isUploadingImages ? 'Comprimiendo WebP...' : '+ Subir Fotos'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImages}
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
            </div>

            {gallery.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-[#fafafa] p-6 text-center text-xs text-zinc-500">
                Aún no hay fotos cargadas para este producto. Subí una o más imágenes (JPG, PNG o WebP).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gallery.map((item, idx) => (
                  <div
                    key={item.tempKey}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropImage(idx)}
                    className={`rounded-lg border p-3 bg-white space-y-2.5 transition-colors ${
                      item.is_primary
                        ? 'border-zinc-900 ring-1 ring-zinc-900'
                        : 'border-zinc-200'
                    }`}
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-md border border-zinc-100 bg-[#fafafa]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt_text || name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <span className="rounded bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
                          #{idx + 1}
                        </span>
                        {item.is_primary && (
                          <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            Principal
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-600 mb-0.5">
                        Vincular a Variante (Opcional)
                      </label>
                      <select
                        value={item.variant_id}
                        onChange={(e) =>
                          setGallery((prev) =>
                            prev.map((g) =>
                              g.tempKey === item.tempKey
                                ? { ...g, variant_id: e.target.value }
                                : g
                            )
                          )
                        }
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px]"
                      >
                        <option value="">— Foto General del Producto —</option>
                        {variants.map((v) => (
                          <option key={v.tempKey} value={v.tempKey}>
                            {v.name} {v.sku ? `(${v.sku})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 text-[11px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, -1)}
                          disabled={idx === 0}
                          className="rounded border border-zinc-200 px-1.5 py-0.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                          title="Mover antes"
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 1)}
                          disabled={idx === gallery.length - 1}
                          className="rounded border border-zinc-200 px-1.5 py-0.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                          title="Mover después"
                        >
                          &rarr;
                        </button>
                        {!item.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(item.tempKey)}
                            className="ml-1 font-medium text-zinc-900 hover:underline"
                          >
                            Hacer principal
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(item)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={handleCancelAndCleanup}
              disabled={isSubmitting || isUploadingImages}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImages}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando Producto...'
                : editingProduct
                ? 'Guardar Cambios'
                : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>

      <QuickCategoryModal
        isOpen={isQuickCategoryOpen}
        onClose={() => setIsQuickCategoryOpen(false)}
        existingCategories={categories}
        onCreated={(newCategory) => {
          setCategories((prev) => [...prev, newCategory])
          setCategoryId(newCategory.id)
        }}
      />
    </div>
  )
}
