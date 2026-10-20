'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface AdminNavItem {
  label: string
  href: string
  description: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard & Monitor',
    href: '/admin',
    description: 'Métricas y estado del Free Tier',
  },
  {
    label: 'Productos y Precios',
    href: '/admin/productos',
    description: 'Catálogo, variantes y galería WebP',
  },
  {
    label: 'Categorías',
    href: '/admin/categorias',
    description: 'Árbol de categorías y subcategorías',
  },
  {
    label: 'Auditoría de Stock',
    href: '/admin/stock',
    description: 'Entradas, salidas y ajustes',
  },
  {
    label: 'Portada y Banners',
    href: '/admin/portada',
    description: 'Hero dinámico de la página principal',
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-white">
      <div className="p-5 border-b border-zinc-200">
        <Link href="/admin" className="block space-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Panel de Gestión
          </span>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            El Peque Hong Kong
          </h2>
        </Link>
      </div>

      <nav
        aria-label="Navegación administrativa"
        className="p-3 flex md:flex-col gap-1 overflow-x-auto"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap md:whitespace-normal',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <div className="font-medium">{item.label}</div>
              <div
                className={cn(
                  'hidden md:block text-[11px] mt-0.5',
                  isActive ? 'text-zinc-300' : 'text-zinc-400'
                )}
              >
                {item.description}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="hidden md:block p-4 mt-auto border-t border-zinc-200">
        <Link
          href="/"
          className="block rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          Ver tienda pública ↗
        </Link>
      </div>
    </aside>
  )
}
