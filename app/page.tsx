import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 bg-[#fafafa] text-zinc-900">
      <div className="max-w-xl w-full space-y-4 text-center">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Catálogo Digital &amp; Inventario
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          El Peque Hong Kong
        </h1>
        <p className="text-sm text-zinc-500">
          Plataforma inicializada. Navega al catálogo o al panel administrativo.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/catalogo"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition"
          >
            Ver Catálogo
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
          >
            Panel Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
