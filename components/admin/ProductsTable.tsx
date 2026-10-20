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
import {
  Plus,
  Search,
  Percent,
  Star,
  Edit3,
  Trash2,
  Package,
  Layers,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react'

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
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
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-900 bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition"
            >
              <Percent className="size-3.5" />
              <span>Ajustar Precios % ({selectedIds.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              setIsProductModalOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-950 transition shadow-sm shrink-0"
          >
            <Plus className="size-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
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
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-3">
            <Package className="size-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">
            No se encontraron productos.
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Probá cambiando o limpiando los filtros para ver otros productos.'
              : 'Todavía no cargaste productos. Tocá en "+ Nuevo Producto" para crear el primero.'}
          </p>
        </div>
      ) : (
        <>
          {/* VISTA MOBILE: Tarjetas Táctiles (md:hidden) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
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
              const isSelected = selectedIds.includes(product.id)

              return (
                <div
                  key={product.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition space-y-3.5 ${
                    isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'
                  }`}
                >
                  {/* Fila superior: Checkbox, Imagen, Nombre y Categoría */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${product.name}`}
                      checked={isSelected}
                      onChange={() => handleToggleSelectRow(product.id)}
                      className="mt-1 h-5 w-5 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                    />

                    {primaryImage ? (
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                        <ImageIcon className="size-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h3 className="text-sm font-bold text-zinc-900 leading-tight truncate">
                          {product.name}
                        </h3>
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => handleToggleFeatured(product)}
                          className={`p-1 rounded-lg transition ${
                            product.is_featured
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-zinc-300 hover:text-zinc-500'
                          }`}
                          title={product.is_featured ? 'Producto destacado' : 'Destacar'}
                        >
                          <Star className="size-4 fill-current" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-medium text-zinc-500 truncate">
                          {product.category?.name ?? 'Sin categoría'}
                        </span>
                        <span className="text-zinc-300">·</span>
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                            product.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : product.status === 'draft'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {product.status === 'active'
                            ? 'Activo'
                            : product.status === 'draft'
                            ? 'Borrador'
                            : 'Archivado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fila intermedia: Precio y Stock */}
                  <div className="flex items-center justify-between rounded-xl bg-zinc-50/80 p-3 text-xs">
                    <div>
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        Precio
                      </span>
                      {editingPriceId === product.id ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="number"
                            min={1}
                            step="any"
                            value={inlinePriceValue}
                            onChange={(e) => setInlinePriceValue(e.target.value)}
                            className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold"
                          />
                          <button
                            type="button"
                            disabled={isRowBusy}
                            onClick={() => handleSaveInlinePrice(product.id)}
                            className="rounded-lg bg-zinc-900 p-1 text-white hover:bg-zinc-800"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceId(null)}
                            className="rounded-lg border border-zinc-300 p-1 text-zinc-500 hover:bg-zinc-100"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-base font-bold text-zinc-900">
                            {formatCurrencyARS(product.base_price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(product.id)
                              setInlinePriceValue(String(product.base_price))
                            }}
                            className="text-[10px] text-zinc-500 font-semibold underline hover:text-zinc-900"
                          >
                            Cambiar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 block font-medium">
                        Stock disponible
                      </span>
                      <span
                        className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          totalStock <= 0
                            ? 'bg-red-50 text-red-700'
                            : totalStock <= 3
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {totalStock} {totalStock === 1 ? 'unidad' : 'unidades'}
                      </span>
                    </div>
                  </div>

                  {/* Fila inferior: Botones de Acción */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(product)
                        setIsProductModalOpen(true)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-800 transition"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Editar Producto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition"
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* VISTA DESKTOP: Tabla Completa (hidden md:block) */}
          <div className="hidden md:block rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-3 w-9">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos los productos filtrados"
                        checked={allFilteredSelected}
                        onChange={handleToggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3">Precio Base</th>
                    <th className="py-3 px-3">Variantes / Stock</th>
                    <th className="py-3 px-3">Destacado</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 text-xs">
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
                        className="hover:bg-zinc-50/70 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${product.name}`}
                            checked={selectedIds.includes(product.id)}
                            onChange={() => handleToggleSelectRow(product.id)}
                            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {primaryImage ? (
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={primaryImage.url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
                                <ImageIcon className="size-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-zinc-900">
                                {product.name}
                              </div>
                              <div className="font-mono text-[11px] text-zinc-400">
                                /{product.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-700">
                          {product.category?.name ? (
                            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                              {product.category.name}
                            </span>
                          ) : (
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
                                className="w-24 rounded-lg border border-zinc-300 px-2 py-1 font-mono text-xs"
                              />
                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={() => handleSaveInlinePrice(product.id)}
                                className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white"
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPriceId(null)}
                                className="rounded-md border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-600"
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
                                className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100"
                              >
                                Editar $
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-zinc-900">
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
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
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
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              Activo
                            </span>
                          ) : product.status === 'draft' ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              Borrador
                            </span>
                          ) : (
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
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
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
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
          </div>
        </>
      )}

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

      {/* Modal de confirmación de eliminación amigable */}
      {deletingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de producto"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/40 p-0 sm:p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-600">
                Eliminar Producto
              </p>
              <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                ¿Eliminar &ldquo;{deletingProduct.name}&rdquo;?
              </h3>
            </div>
            <p className="text-xs text-zinc-600">
              Se eliminará este producto junto con sus {deletingProduct.variants.length} variantes y fotos asociadas del catálogo. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={busyProductId === deletingProduct.id}
                className="flex-1 sm:flex-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busyProductId === deletingProduct.id}
                className="flex-1 sm:flex-none rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {busyProductId === deletingProduct.id
                  ? 'Eliminando...'
                  : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
