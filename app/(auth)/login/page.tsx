import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
import { sanitizeRedirectPath } from '@/lib/supabase/proxy'

export const metadata: Metadata = {
  title: 'Acceso Administrador',
  description: 'Ingreso exclusivo al panel administrativo de El Peque Hong Kong.',
}

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const redirectTo = sanitizeRedirectPath(params.redirect)

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#fafafa] text-zinc-900">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Administración
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            El Peque Hong Kong
          </h1>
          <p className="text-xs text-zinc-500">
            Ingresá con tu cuenta de administrador único para gestionar catálogo y stock.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
          <SignInForm redirectTo={redirectTo} />
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4 transition-colors"
          >
            Volver a la tienda pública
          </Link>
        </div>
      </div>
    </main>
  )
}
