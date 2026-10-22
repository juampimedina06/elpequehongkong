'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export function HomeSearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      router.push('/catalogo')
      return
    }
    router.push(`/catalogo?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="relative max-w-2xl mx-auto w-full group"
    >
      <div className="relative flex items-center bg-white border-2 border-zinc-950 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden p-1.5 focus-within:ring-2 focus-within:ring-black">
        <div className="pl-3 sm:pl-4 text-zinc-400 group-focus-within:text-zinc-950 transition-colors">
          <Search className="size-5 sm:size-5.5 stroke-[2.2]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué estás buscando? (ej. termos, tazas, bazar, mochilas...)"
          className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none font-medium"
        />
        <button
          type="submit"
          className="shrink-0 bg-zinc-950 text-white hover:bg-zinc-800 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Buscar</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </form>
  )
}
