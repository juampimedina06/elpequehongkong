import Link from 'next/link'

export default function AdminDashboardPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
          Panel de Control
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard &amp; Monitor Free Tier
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Seleccioná un módulo del menú lateral para gestionar el catálogo y el inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/productos"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors"
        >
          <div className="text-xs font-medium text-zinc-900">Productos</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Variantes, precios y galería
          </div>
        </Link>
        <Link
          href="/admin/categorias"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors"
        >
          <div className="text-xs font-medium text-zinc-900">Categorías</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Jerarquía y subcategorías
          </div>
        </Link>
        <Link
          href="/admin/stock"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors"
        >
          <div className="text-xs font-medium text-zinc-900">Stock</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Movimientos y auditoría
          </div>
        </Link>
        <Link
          href="/admin/portada"
          className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors"
        >
          <div className="text-xs font-medium text-zinc-900">Portada</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Banners promocionales
          </div>
        </Link>
      </div>
    </div>
  )
}
