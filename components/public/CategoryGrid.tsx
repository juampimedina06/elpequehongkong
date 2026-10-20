import Link from 'next/link'
import Image from 'next/image'
import type { CategoryRow } from '@/types/database.types'
import { ArrowUpRight } from 'lucide-react'

interface CategoryGridProps {
  categories: CategoryRow[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null

  return (
    <section id="categorias" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black pb-4 gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 block mb-1">
            02 / Departamentos
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
            Colecciones &amp; Categorías
          </h2>
        </div>
        <Link
          href="/catalogo"
          className="group inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 hover:text-zinc-600 transition"
        >
          <span>Ver todas las colecciones</span>
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            className="group relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-zinc-900 flex flex-col justify-end p-5 sm:p-6 transition-all"
          >
            {/* Foto de Fondo o Gradiente Minimalista */}
            {cat.image_url ? (
              <Image
                src={cat.image_url}
                alt={cat.name}
                fill
                className="object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 ease-out"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-900 to-zinc-800 opacity-90 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Overlay Oscuro para Legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Contenido Editorial de la Tarjeta */}
            <div className="relative z-10 space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                0{idx + 1}
              </span>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.15em] text-white leading-tight">
                {cat.name}
              </h3>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-300 group-hover:text-white transition-colors pt-1">
                <span>Explorar</span>
                <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
