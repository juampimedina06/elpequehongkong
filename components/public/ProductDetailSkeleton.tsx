import { Skeleton } from '@/components/ui/skeleton'

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in-50 duration-300">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 pb-2 border-b border-black/10">
        <Skeleton className="h-3 w-12 bg-zinc-200" />
        <span className="text-zinc-300">/</span>
        <Skeleton className="h-3 w-16 bg-zinc-200" />
        <span className="text-zinc-300">/</span>
        <Skeleton className="h-3 w-28 bg-zinc-200" />
      </div>

      {/* Grid Principal 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Columna Izquierda: Galería de Fotos */}
        <div className="lg:col-span-7 w-full space-y-4">
          <Skeleton className="aspect-square sm:aspect-4/3 lg:aspect-square w-full rounded-2xl bg-zinc-100" />
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-square rounded-xl bg-zinc-100"
              />
            ))}
          </div>
        </div>

        {/* Columna Derecha: Información y Acciones */}
        <div className="lg:col-span-5 space-y-7">
          {/* Categoría y Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 bg-zinc-100" />
              <Skeleton className="h-4 w-16 bg-zinc-100" />
            </div>

            {/* Título de Producto */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-11/12 bg-zinc-200" />
              <Skeleton className="h-8 w-2/3 bg-zinc-200" />
            </div>
          </div>

          {/* Precio */}
          <div className="space-y-2 border-b border-black/10 pb-4">
            <Skeleton className="h-10 w-44 bg-zinc-200" />
            <Skeleton className="h-3 w-64 bg-zinc-100" />
          </div>

          {/* Variantes */}
          <div className="space-y-3">
            <Skeleton className="h-3 w-32 bg-zinc-100" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-zinc-100" />
              ))}
            </div>
          </div>

          {/* Botón WhatsApp Skeleton */}
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-14 w-full rounded-xl bg-zinc-200" />
            <div className="flex justify-center">
              <Skeleton className="h-3 w-56 bg-zinc-100" />
            </div>
          </div>

          {/* Fichas de Beneficios */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-black/10">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-zinc-100" />
            ))}
          </div>

          {/* Acordeones */}
          <div className="border-t border-black/10 divide-y divide-black/10 pt-2 space-y-3">
            <Skeleton className="h-10 w-full bg-zinc-100" />
            <Skeleton className="h-10 w-full bg-zinc-100" />
            <Skeleton className="h-10 w-full bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
