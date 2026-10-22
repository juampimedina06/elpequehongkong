'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { ProductWithRelations } from '@/types/database.types'
import type { PaginatedCatalogResult } from '@/services/products.repository'

export interface CatalogQueryFilters {
  q?: string
  categoria?: string
  subcategoria?: string
  minPrice?: number
  maxPrice?: number
  orden?: string
  enStock?: boolean
}

export function useCatalogInfinite(
  filters: CatalogQueryFilters,
  initialData?: PaginatedCatalogResult
) {
  return useInfiniteQuery({
    queryKey: ['catalog', 'products', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams()
      params.set('page', String(pageParam))
      params.set('limit', '20')

      if (filters.q) params.set('q', filters.q)
      if (filters.categoria) params.set('categoria', filters.categoria)
      if (filters.subcategoria) params.set('subcategoria', filters.subcategoria)
      if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
        params.set('minPrice', String(filters.minPrice))
      }
      if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
        params.set('maxPrice', String(filters.maxPrice))
      }
      if (filters.orden) params.set('orden', filters.orden)
      if (filters.enStock) params.set('enStock', 'true')

      const res = await fetch(`/api/catalog?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Error al obtener productos del servidor')
      }
      return (await res.json()) as PaginatedCatalogResult
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [0],
        }
      : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché en memoria
    gcTime: 1000 * 60 * 30, // 30 minutos sin garbage collect
  })
}
