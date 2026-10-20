import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface AdminHeaderProps {
  adminEmail?: string | null
}

export function AdminHeader({ adminEmail }: AdminHeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <p className="text-xs text-zinc-600 truncate">
          Sesión activa:{' '}
          <span className="font-medium text-zinc-900">
            {adminEmail || 'Administrador'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          className="md:hidden rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          Ver tienda pública
        </Link>
        <LogoutButton />
      </div>
    </header>
  )
}
