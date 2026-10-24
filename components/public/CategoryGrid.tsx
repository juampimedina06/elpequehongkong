import Link from 'next/link'
import Image from 'next/image'
import type { CategoryRow } from '@/types/database.types'
import { ArrowUpRight, FolderTree, ShoppingBag } from 'lucide-react'

interface CategoryGridProps {
  categories: CategoryRow[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null

  return (
    <section id="categorias" className="space-y-6">
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

      {/* Grilla Lookbook estilo Kith (4 columnas, tarjetas verticales, botón flotante circular) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {categories.map((cat, idx) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            className="group flex flex-col bg-transparent transition-all"
          >
            {/* Contenedor de Fotografía Editorial Proporción 3:4 con Botón Flotante */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f0f0f0] select-none">
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  quality={75}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-2 bg-[#f4f4f4]">
                  <FolderTree className="size-8 stroke-[1.2]" />
                  <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-400">
                    Colección
                  </span>
                </div>
              )}

              {/* Botón Flotante Circular de Carrito/Bolsa (exacto a la imagen 1 de Kith) */}
              <div
                aria-hidden="true"
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 size-8 sm:size-9 rounded-full bg-white text-zinc-950 shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              >
                <ShoppingBag className="size-3.5 sm:size-4 stroke-[1.75]" />
              </div>
            </div>

            {/* Información Tipográfica Debajo de la Foto */}
            <div className="pt-2.5 pb-1 flex items-baseline justify-between gap-2">
              <h3 className="font-bold text-xs sm:text-[13px] text-zinc-950 uppercase tracking-tight leading-snug line-clamp-1 group-hover:underline underline-offset-4 decoration-zinc-900/60">
                {cat.name}
              </h3>
              <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                ({String(idx + 1).padStart(2, '0')})
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
