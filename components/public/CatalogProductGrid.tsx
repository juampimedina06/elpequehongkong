'use client'

import { useEffect, useRef } from 'react'
import { useCatalogInfinite, type CatalogQueryFilters } from '@/hooks/useCatalogInfinite'
import type { PaginatedCatalogResult } from '@/services/products.repository'
import { ProductCard } from '@/components/public/ProductCard'
import { PackageOpen, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface CatalogProductGridProps {
  initialResult: PaginatedCatalogResult
  filters: CatalogQueryFilters
}

export function CatalogProductGrid({
  initialResult,
  filters,
}: CatalogProductGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useCatalogInfinite(filters, initialResult)

  const observerRef = useRef<HTMLDivElement | null>(null)

  // IntersectionObserver con anticipación temprana (1000px antes del fondo)
  useEffect(() => {
    const target = observerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        rootMargin: '1000px 0px', // Carga con mucha anticipación antes de que el usuario llegue
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Listener de scroll pasivo complementario para garantizar fluidez absoluta
  useEffect(() => {
    const onScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return
      const scrollPos = window.innerHeight + window.scrollY
      const triggerThreshold = document.documentElement.scrollHeight - 1000
      if (scrollPos >= triggerThreshold) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allProducts = data ? data.pages.flatMap((page) => page.products) : []
  const totalCount = data?.pages[0]?.totalCount ?? allProducts.length

  if (isLoading && allProducts.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 animate-in fade-in-50">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl bg-zinc-100" />
            <Skeleton className="h-4 w-3/4 bg-zinc-100" />
            <Skeleton className="h-4 w-1/3 bg-zinc-100" />
          </div>
        ))}
      </div>
    )
  }

  if (isError && allProducts.length === 0) {
    return (
      <div className="border border-zinc-200 bg-[#fafafa] p-12 text-center space-y-3 rounded-2xl">
        <p className="text-sm font-semibold text-rose-600">
          Hubo un problema al cargar los productos.
        </p>
        <p className="text-xs text-zinc-500">
          Por favor, recargá la página o intentá nuevamente en unos instantes.
        </p>
      </div>
    )
  }

  if (allProducts.length === 0) {
    return (
      <div className="border border-zinc-200 bg-[#fafafa] p-12 sm:p-16 text-center space-y-3 rounded-2xl">
        <div className="size-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
          <PackageOpen className="size-6" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
          No se encontraron productos
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Probá ajustando el término de búsqueda, desmarcando el filtro de stock o seleccionando otra categoría.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Grilla Editorial de Productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12">
        {allProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Skeletons para carga de siguiente página */}
      {isFetchingNextPage && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-2xl bg-zinc-100" />
              <Skeleton className="h-4 w-3/4 bg-zinc-100" />
              <Skeleton className="h-4 w-1/3 bg-zinc-100" />
            </div>
          ))}
        </div>
      )}

      {/* Centinela de Scroll Infinito */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {hasNextPage && !isFetchingNextPage && (
          <span className="text-[11px] text-zinc-400 font-medium">
            Deslizá para ver más productos...
          </span>
        )}
        {!hasNextPage && allProducts.length > 0 && (
          <p className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
            Mostrando todos los productos ({totalCount})
          </p>
        )}
      </div>
    </div>
  )
}
