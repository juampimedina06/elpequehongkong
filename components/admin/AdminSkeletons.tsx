import { Skeleton } from '@/components/ui/skeleton'

export function AdminHeaderSkeleton({
  tag = 'Panel de Control',
  title = 'Cargando...',
  description = 'Obteniendo los datos más recientes de tu catálogo.',
}: {
  tag?: string
  title?: string
  description?: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
        {tag}
      </p>
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-zinc-500">{description}</p>
    </div>
  )
}

export function ProductsTableSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <AdminHeaderSkeleton
        tag="Catálogo de Productos"
        title="Productos y Precios"
        description="Cargá tus productos, fotos, precios y variantes."
      />

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-100" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-100" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-100" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl bg-zinc-200" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <Skeleton className="h-4 w-32 bg-zinc-100" />
          <Skeleton className="h-4 w-20 bg-zinc-100" />
        </div>
        <div className="divide-y divide-zinc-100">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 flex-1">
                <Skeleton className="size-12 rounded-xl bg-zinc-100 shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-md">
                  <Skeleton className="h-4 w-3/4 bg-zinc-100" />
                  <Skeleton className="h-3 w-1/3 bg-zinc-100" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                <Skeleton className="h-6 w-20 rounded-lg bg-zinc-100" />
                <Skeleton className="h-6 w-16 rounded-lg bg-zinc-100" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-lg bg-zinc-100" />
                <Skeleton className="size-8 rounded-lg bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CategoriesTableSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <AdminHeaderSkeleton
        tag="Organización de tu Tienda"
        title="Categorías de Productos"
        description="Creá y organizá las categorías y subcategorías para tus clientes."
      />

      <div className="flex justify-between items-center rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-10 w-64 rounded-xl bg-zinc-100" />
        <Skeleton className="h-10 w-40 rounded-xl bg-zinc-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-xl bg-zinc-100" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 bg-zinc-100" />
                <Skeleton className="h-3 w-1/2 bg-zinc-100" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <Skeleton className="h-5 w-16 rounded-md bg-zinc-100" />
              <div className="flex gap-2">
                <Skeleton className="size-7 rounded-lg bg-zinc-100" />
                <Skeleton className="size-7 rounded-lg bg-zinc-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StockSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <AdminHeaderSkeleton
        tag="Inventario y Stock"
        title="Control de Stock"
        description="Registrá ingresos, egresos y ajustes con trazabilidad."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-sm"
          >
            <Skeleton className="h-3 w-24 bg-zinc-100" />
            <Skeleton className="h-7 w-32 bg-zinc-100" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <Skeleton className="h-10 w-full rounded-xl bg-zinc-100" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-48 bg-zinc-100" />
                <Skeleton className="h-3 w-28 bg-zinc-100" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BannersSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <AdminHeaderSkeleton
        tag="Marketing y Vitrina"
        title="Fotos de Portada"
        description="Gestioná los banners principales y promociones."
      />

      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-xl bg-zinc-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm space-y-3 p-4"
          >
            <Skeleton className="h-44 w-full rounded-xl bg-zinc-100" />
            <Skeleton className="h-5 w-3/4 bg-zinc-100" />
            <Skeleton className="h-3 w-1/2 bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <AdminHeaderSkeleton
        tag="Panel General"
        title="Hola, Administrador"
        description="Resumen en tiempo real del estado de tu negocio."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-2 shadow-sm"
          >
            <Skeleton className="h-3 w-24 bg-zinc-100" />
            <Skeleton className="h-8 w-28 bg-zinc-100" />
            <Skeleton className="h-3 w-36 bg-zinc-100" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
          <Skeleton className="h-5 w-36 bg-zinc-100" />
          <Skeleton className="h-48 w-full rounded-xl bg-zinc-100" />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
          <Skeleton className="h-5 w-36 bg-zinc-100" />
          <Skeleton className="h-48 w-full rounded-xl bg-zinc-100" />
        </div>
      </div>
    </div>
  )
}
