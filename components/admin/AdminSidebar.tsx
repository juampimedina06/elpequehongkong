'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ArrowUpDown,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  mobileLabel: string
  href: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Inicio',
    mobileLabel: 'Inicio',
    href: '/admin',
    description: 'Resumen y estado de tu negocio',
    icon: LayoutDashboard,
  },
  {
    label: 'Productos',
    mobileLabel: 'Productos',
    href: '/admin/productos',
    description: 'Precios, fotos y catálogo',
    icon: Package,
  },
  {
    label: 'Categorías',
    mobileLabel: 'Categorías',
    href: '/admin/categorias',
    description: 'Secciones de la tienda',
    icon: FolderTree,
  },
  {
    label: 'Control de Stock',
    mobileLabel: 'Stock',
    href: '/admin/stock',
    description: 'Entradas, salidas y conteos',
    icon: ArrowUpDown,
  },
  {
    label: 'Fotos de Portada',
    mobileLabel: 'Portada',
    href: '/admin/portada',
    description: 'Banners y promociones',
    icon: ImageIcon,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* BARRA DE NAVEGACIÓN INFERIOR PARA MOBILE (md:hidden) */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-1 py-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-w-0',
                isActive
                  ? 'text-zinc-900 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 active:scale-95'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500'
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                {item.mobileLabel}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* SIDEBAR PARA COMPUTADORA / TABLET (hidden md:flex) */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-zinc-200 bg-white min-h-screen">
        <div className="p-4 border-b border-zinc-200">
          <Link href="/admin" prefetch={true} className="flex items-center gap-3 group">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white shadow-2xs group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/img/logo.png"
                alt="El Pequeño Hong Kong"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 block group-hover:text-zinc-600 transition truncate leading-none">
                Administración
              </span>
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 truncate mt-1">
                El Peque Hong Kong
              </h2>
            </div>
          </Link>
        </div>

        <nav
          aria-label="Navegación administrativa"
          className="p-3 flex flex-col gap-1.5 flex-1"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
                )}
              >
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isActive ? 'text-white' : 'text-zinc-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{item.label}</div>
                  <div
                    className={cn(
                      'text-[11px] font-normal truncate mt-0.5',
                      isActive ? 'text-zinc-300' : 'text-zinc-400'
                    )}
                  >
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 mt-auto">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300 transition-colors shadow-sm"
          >
            <span>Ver tienda pública</span>
            <ExternalLink className="size-3.5 text-zinc-500" />
          </Link>
        </div>
      </aside>
    </>
  )
}
