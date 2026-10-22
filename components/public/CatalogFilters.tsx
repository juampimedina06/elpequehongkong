'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { CategoryRow } from '@/types/database.types'
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

interface CatalogFiltersProps {
  categories: CategoryRow[]
}

export function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for immediate responsiveness
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const currentCategory = searchParams.get('categoria') ?? ''
  const currentSubcategory = searchParams.get('subcategoria') ?? ''
  const currentSort = searchParams.get('orden') ?? 'recientes'
  const inStockOnly = searchParams.get('enStock') === 'true'

  // Debounced search query
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQ = searchParams.get('q') ?? ''
      if (searchTerm.trim() !== currentQ) {
        updateParams({ q: searchTerm.trim() || null })
      }
    }, 350)

    return () => clearTimeout(handler)
  }, [searchTerm])

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'enStock' && value === 'false')) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handlePriceApply = () => {
    updateParams({
      minPrice: minPrice ? minPrice : null,
      maxPrice: maxPrice ? maxPrice : null,
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setMinPrice('')
    setMaxPrice('')
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.get('q') ||
      searchParams.get('categoria') ||
      searchParams.get('subcategoria') ||
      searchParams.get('minPrice') ||
      searchParams.get('maxPrice') ||
      searchParams.get('enStock') ||
      (searchParams.get('orden') && searchParams.get('orden') !== 'recientes')
  )

  const parentCategories = categories.filter((c) => !c.parent_id)
  const selectedParentCategory = categories.find(
    (c) => c.slug === currentCategory && !c.parent_id
  )
  const availableSubcategories = selectedParentCategory
    ? categories.filter((c) => c.parent_id === selectedParentCategory.id)
    : []

  return (
    <div className="w-full space-y-4">
      {/* Search Bar & Mobile Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código SKU o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-hidden transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                updateParams({ q: null })
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700">
            <ArrowUpDown className="size-3.5 text-zinc-400" />
            <select
              value={currentSort}
              onChange={(e) => updateParams({ orden: e.target.value })}
              className="bg-transparent text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="sm:hidden flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Filter Sidebar / Drawer Panel */}
      <div
        className={`sm:block space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all ${
          isMobileOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-zinc-600" />
            <span className="text-xs font-semibold text-zinc-900">Filtros Activos</span>
            {isPending && (
              <span className="text-[10px] text-zinc-400 animate-pulse">Actualizando...</span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium transition"
            >
              Limpiar todo
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Categories & Subcategories */}
          <div className="space-y-3">
            <span className="font-semibold text-zinc-900 block">Categoría</span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateParams({ categoria: null, subcategoria: null })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  !currentCategory
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Todas
              </button>
              {parentCategories.map((cat) => {
                const isSelected = currentCategory === cat.slug
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      updateParams({
                        categoria: isSelected ? null : cat.slug,
                        subcategoria: null,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>

            {/* Subcategorías contextuales cuando se selecciona una categoría padre */}
            {availableSubcategories.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block w-full tracking-wider">
                  Subcategorías en {selectedParentCategory?.name}:
                </span>
                <button
                  type="button"
                  onClick={() => updateParams({ subcategoria: null })}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                    !currentSubcategory
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Todas ({selectedParentCategory?.name})
                </button>
                {availableSubcategories.map((sub) => {
                  const isSubSelected = currentSubcategory === sub.slug
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        updateParams({
                          subcategoria: isSubSelected ? null : sub.slug,
                        })
                      }
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                        isSubSelected
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <span className="font-semibold text-zinc-900 block">Rango de Precio</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceApply()}
                className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs focus:border-zinc-900 focus:outline-hidden"
              />
              <span className="text-zinc-400">—</span>
              <input
                type="number"
                placeholder="Máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceApply()}
                className="w-24 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs focus:border-zinc-900 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handlePriceApply}
                className="rounded-lg bg-zinc-900 px-3 py-1 font-medium text-white hover:bg-zinc-800 transition"
              >
                Filtrar
              </button>
            </div>
          </div>

          {/* Stock Filter Switch */}
          <div className="space-y-2 flex flex-col justify-center">
            <span className="font-semibold text-zinc-900 block">Disponibilidad</span>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateParams({ enStock: e.target.checked ? 'true' : null })}
                className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900 cursor-pointer"
              />
              <span className="text-xs text-zinc-700 font-medium">
                Solo productos con stock disponible
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
