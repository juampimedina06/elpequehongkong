import Link from 'next/link'
import { Store, Shield } from 'lucide-react'

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-wider group-hover:bg-zinc-800 transition">
            HK
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight text-zinc-900 uppercase">
              El Peque Hong Kong
            </span>
            <span className="text-[10px] text-zinc-400">Catálogo &amp; Novedades</span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/catalogo"
            className="text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5"
          >
            <Store className="size-3.5" />
            <span>Catálogo Completo</span>
          </Link>

          <Link
            href="/admin"
            className="text-zinc-400 hover:text-zinc-700 transition flex items-center gap-1.5 pl-2 border-l border-zinc-200"
            title="Panel de Administración"
          >
            <Shield className="size-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
