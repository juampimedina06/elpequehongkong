import Link from 'next/link'
import Image from 'next/image'
import type { CategoryRow } from '@/types/database.types'
import { Folder } from 'lucide-react'

interface CategoryGridProps {
  categories: CategoryRow[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight">Categorías Populares</h2>
          <p className="text-xs text-zinc-500">Explora nuestro catálogo por departamento</p>
        </div>
        <Link
          href="/catalogo"
          className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition"
        >
          Ver todas &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs transition text-center"
          >
            <div className="relative size-12 rounded-lg bg-zinc-100 flex items-center justify-center mb-2 overflow-hidden group-hover:bg-zinc-200 transition">
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="48px"
                />
              ) : (
                <Folder className="size-5 text-zinc-400 group-hover:text-zinc-600 transition" />
              )}
            </div>
            <span className="text-xs font-semibold text-zinc-800 line-clamp-1 group-hover:text-zinc-950 transition">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
