import Link from 'next/link'
import Image from 'next/image'
import type { CategoryRow } from '@/types/database.types'
import { ArrowUpRight, FolderTree } from 'lucide-react'

interface CategoryGridProps {
  categories: CategoryRow[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null

  return (
    <section id="categorias" className="space-y-8">
      {/* Encabezado Editorial estilo Kith */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black pb-4 gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 block mb-1">
            02 / Departamentos &amp; Estilos
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
            Colecciones de Temporada
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

      {/* Grilla Lookbook Editorial Kith (Fotografía limpia + Información debajo) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            className="group flex flex-col justify-between bg-transparent transition-all"
          >
            {/* Contenedor de Fotografía Editorial Proporción 3:4 */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f5] border border-black/10 select-none">
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-2 bg-[#f8f8f8]">
                  <FolderTree className="size-8 stroke-[1.2]" />
                  <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400">
                    Colección
                  </span>
                </div>
              )}

              {/* Indicador de Número Editorial en esquina */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-black font-mono text-[9px] tracking-widest px-2 py-0.5 border border-black/10">
                {String(idx + 1).padStart(2, '0')}
              </div>
            </div>

            {/* Información Tipográfica Kith Ubicada Debajo de la Foto */}
            <div className="pt-3.5 pb-1 space-y-1">
              <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-zinc-400 block">
                Departamento {String(idx + 1).padStart(2, '0')}
              </span>

              <h3 className="font-bold text-xs sm:text-sm text-zinc-950 uppercase tracking-tight leading-snug line-clamp-1 group-hover:underline underline-offset-4 decoration-zinc-900/60">
                {cat.name}
              </h3>

              <div className="pt-1 flex items-center gap-1 text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400 group-hover:text-zinc-950 transition-colors">
                <span>Ver Colección</span>
                <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
