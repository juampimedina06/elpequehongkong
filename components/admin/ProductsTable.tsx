'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrencyARS } from '@/utils/formatters'
import {
  deleteProductAction,
  updateProductQuickFieldsAction,
} from '@/actions/products/products.actions'
import { ProductFormModal } from '@/components/admin/ProductFormModal'
import { BulkPriceUpdateModal } from '@/components/admin/BulkPriceUpdateModal'
import type {
  CategoryRow,
  ProductStatus,
  ProductWithRelations,
} from '@/types/database.types'

function filterProductsInClient(
  products: ProductWithRelations[],
  filters: {
    q?: string
    categoryId?: string
    status?: ProductStatus | 'all' | ''
  }
): ProductWithRelations[] {
  const query = (filters.q ?? '').trim().toLowerCase()
  const categoryId = (filters.categoryId ?? '').trim()
  const status = (filters.status ?? '').trim()

  return products.filter((product) => {
    if (categoryId && categoryId !== 'all' && product.category_id !== categoryId) {
      return false
    }
    if (status && status !== 'all' && product.status !== status) {
      return false
    }
    if (query) {
      const matchesName = product.name.toLowerCase().includes(query)
      const matchesSlug = product.slug.toLowerCase().includes(query)
      const matchesSku = product.variants.some((v) =>
        (v.sku ?? '').toLowerCase().includes(query)
      )
      if (!matchesName && !matchesSlug && !matchesSku) {
        return false
      }
    }
    return true
  })
}

interface ProductsTableProps {
  initialProducts: ProductWithRelations[]
  categories: CategoryRow[]
  initialSearchQuery?: string
}

export function ProductsTable({
  initialProducts,
  categories,
  initialSearchQuery = '',
}: ProductsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('')
  const [busyProductId, setBusyProductId] = useState<string | null>(null)

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] =
    useState<ProductWithRelations | null>(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] =
    useState<ProductWithRelations | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const filteredProducts = useMemo(
    () =>
      filterProductsInClient(initialProducts, {
        q: searchQuery,
        categoryId: categoryFilter,
        status: statusFilter,
      }),
    [initialProducts, searchQuery, categoryFilter, statusFilter]
  )

  const selectedProducts = useMemo(
    () => initialProducts.filter((p) => selectedIds.includes(p.id)),
    [initialProducts, selectedIds]
  )

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id))

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredProducts.map((p) => p.id))
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)))
    } else {
      const merged = new Set([
        ...selectedIds,
        ...filteredProducts.map((p) => p.id),
      ])
      setSelectedIds(Array.from(merged))
    }
  }

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleToggleFeatured = async (product: ProductWithRelations) => {
    setBusyProductId(product.id)
    setFeedbackError(null)
    try {
      const res = await updateProductQuickFieldsAction(product.id, {
        is_featured: !product.is_featured,
      })
      if (!res.success) {
        setFeedbackError(res.error)
        return
      }
      router.refresh()
    } finally {
      setBusyProductId(null)
    }
  }

  const handleSaveInlinePrice = async (productId: string) => {
    const numeric = Number(inlinePriceValue)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFeedbackError('El precio rápido debe ser mayor a 0.')
      return
    }
    setBusyProductId(productId)
    setFeedbackError(null)
    try {
      const res = await updateProductQuickFieldsAction(productId, {
        base_price: numeric,
      })
      if (!res.success) {
        setFeedbackError(res.error)
        return
      }
      setEditingPriceId(null)
      router.refresh()
    } finally {
      setBusyProductId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return
    setBusyProductId(deletingProduct.id)
    setFeedbackError(null)
    try {
      const res = await deleteProductAction(deletingProduct.id)
      if (!res.success) {
        setFeedbackError(res.error)
        return
      }
      setSelectedIds((prev) => prev.filter((id) => id !== deletingProduct.id))
      setDeletingProduct(null)
      router.refresh()
    } finally {
      setBusyProductId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda, Filtros y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full rounded-lg border border-zinc-300 bg-[#fafafa] px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProductStatus | 'all')
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="rounded-lg border border-zinc-900 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Actualizar Precios % ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              setIsProductModalOpen(true)
            }}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {feedbackError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {feedbackError}
        </div>
      )}

      {/* Tabla de Productos */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-900">
              No se encontraron productos con los filtros seleccionados.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Probá limpiando los filtros o creá un nuevo producto en el catálogo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#fafafa] text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <th className="py-3 px-3 w-9">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos los productos filtrados"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                    />
                  </th>
                  <th className="py-3 px-3">Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Precio Base (Inline)</th>
                  <th className="py-3 px-3">Variantes / Stock</th>
                  <th className="py-3 px-3">Destacado</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredProducts.map((product) => {
                  const primaryImage =
                    product.images.find((i) => i.is_primary) ??
                    product.images[0] ??
                    null
                  const totalStock = product.variants.reduce(
                    (acc, v) => acc + (v.is_active ? v.stock_quantity : 0),
                    0
                  )
                  const isRowBusy = busyProductId === product.id

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50/80 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${product.name}`}
                          checked={selectedIds.includes(product.id)}
                          onChange={() => handleToggleSelectRow(product.id)}
                          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-[#fafafa]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={primaryImage.url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-[#fafafa] font-mono text-[10px] text-zinc-400">
                              —
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-zinc-900">
                              {product.name}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-500">
                              /{product.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-700">
                        {product.category?.name ?? (
                          <span className="text-zinc-400">Sin categoría</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {editingPriceId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              step="any"
                              value={inlinePriceValue}
                              onChange={(e) =>
                                setInlinePriceValue(e.target.value)
                              }
                              className="w-24 rounded border border-zinc-400 px-2 py-1 font-mono text-xs"
                            />
                            <button
                              type="button"
                              disabled={isRowBusy}
                              onClick={() => handleSaveInlinePrice(product.id)}
                              className="rounded bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceId(null)}
                              className="rounded border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900">
                              {formatCurrencyARS(product.base_price)}
                            </span>
                            {product.compare_at_price && (
                              <span className="text-[11px] text-zinc-400 line-through">
                                {formatCurrencyARS(product.compare_at_price)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(product.id)
                                setInlinePriceValue(String(product.base_price))
                              }}
                              className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                              Editar $
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-900">
                          {totalStock} unid. totales
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {product.variants.length}{' '}
                          {product.variants.length === 1
                            ? 'variante'
                            : 'variantes'}{' '}
                          · {product.images.length} fotos
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleToggleFeatured(product)}
                          className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            product.is_featured
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {product.is_featured ? '★ Destacado' : 'Destacar'}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        {product.status === 'active' ? (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            Activo
                          </span>
                        ) : product.status === 'draft' ? (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Borrador
                          </span>
                        ) : (
                          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            Archivado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product)
                            setIsProductModalOpen(true)
                          }}
                          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(product)}
                          className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSaved={() => router.refresh()}
        editingProduct={editingProduct}
        initialCategories={categories}
      />

      <BulkPriceUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onUpdated={() => {
          setSelectedIds([])
          router.refresh()
        }}
        selectedProducts={selectedProducts}
      />

      {deletingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de producto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[1px]"
        >
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-red-600">
                Eliminar Producto y Galería
              </p>
              <h3 className="text-base font-semibold text-zinc-900 mt-0.5">
                ¿Eliminar &ldquo;{deletingProduct.name}&rdquo;?
              </h3>
            </div>
            <p className="text-xs text-zinc-600">
              Se eliminarán sus{' '}
              <strong>{deletingProduct.variants.length}</strong> variantes y se
              borrarán físicamente sus{' '}
              <strong>{deletingProduct.images.length}</strong> fotos WebP del
              bucket <code className="font-mono">catalog-media</code>.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={busyProductId === deletingProduct.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busyProductId === deletingProduct.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busyProductId === deletingProduct.id
                  ? 'Eliminando...'
                  : 'Eliminar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
