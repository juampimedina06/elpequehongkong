import Link from 'next/link'
import Image from 'next/image'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ExternalLink, Store } from 'lucide-react'

interface AdminHeaderProps {
  adminEmail?: string | null
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-zinc-200 bg-white sticky top-0 z-30 shadow-xs flex items-center">
      <div className="w-full max-w-[1760px] mx-auto px-3.5 sm:px-5 md:px-8 lg:px-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex md:hidden items-center gap-2 font-bold text-zinc-900 text-sm">
            <div className="relative size-7 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white">
              <Image
                src="/assets/img/logo.png"
                alt="El Pequeño Hong Kong"
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
            <span className="truncate">El Peque Hong Kong</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-600 truncate">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate">
              Sesión iniciada como:{' '}
              <strong className="font-semibold text-zinc-900">
                {adminEmail || 'Administrador'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors shadow-2xs"
            title="Abrir la tienda en una pestaña nueva"
          >
            <span>Ver tienda</span>
            <ExternalLink className="size-3 text-zinc-500" />
          </Link>
          <LogoutButton className="rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold" />
        </div>
      </div>
    </header>
  )
}
