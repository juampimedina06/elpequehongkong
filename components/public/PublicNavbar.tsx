'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Shield, Menu, X, MessageCircle } from 'lucide-react'

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Ticker / Banner Superior Minimalista al estilo Kith */}
      <div className="bg-black text-white text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase py-2 px-4 text-center overflow-hidden border-b border-zinc-900">
        <div className="animate-pulse inline-block">
          Envíos a todo el país · Atención directa por WhatsApp · Nueva Colección
        </div>
      </div>

      {/* Header Editorial Fijo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
        <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Botón Menú Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-zinc-900 hover:text-zinc-600 transition"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* Logo Minimalista de Lujo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="group flex flex-col items-center md:items-start text-left"
            >
              <span className="font-black text-base sm:text-lg tracking-[0.25em] uppercase text-zinc-950 group-hover:text-zinc-700 transition">
                El Peque Hong Kong
              </span>
              <span className="hidden sm:block text-[9px] font-medium tracking-[0.3em] uppercase text-zinc-400">
                Lifestyle &amp; Catalog
              </span>
            </Link>
          </div>

          {/* Enlaces de Navegación Centrales (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-600">
            <Link
              href="/#novedades"
              className="hover:text-black transition-colors py-1 hover:border-b-2 hover:border-black"
            >
              Novedades
            </Link>
            <Link
              href="/#categorias"
              className="hover:text-black transition-colors py-1 hover:border-b-2 hover:border-black"
            >
              Colecciones
            </Link>
            <Link
              href="/catalogo"
              className="hover:text-black transition-colors py-1 hover:border-b-2 hover:border-black"
            >
              Catálogo
            </Link>
            <Link
              href="/#destacados"
              className="hover:text-black transition-colors py-1 hover:border-b-2 hover:border-black"
            >
              Destacados
            </Link>
          </nav>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-3">
            <Link
              href="/catalogo"
              className="p-2 text-zinc-600 hover:text-black transition"
              title="Buscar en catálogo"
              aria-label="Buscar"
            >
              <Search className="size-4" />
            </Link>

            <a
              href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-white hover:bg-zinc-800 transition"
            >
              <MessageCircle className="size-3" />
              <span>WhatsApp</span>
            </a>

            <Link
              href="/admin"
              className="p-2 text-zinc-400 hover:text-zinc-800 transition pl-2 border-l border-zinc-200"
              title="Panel de Administración"
            >
              <Shield className="size-4" />
            </Link>
          </div>
        </div>

        {/* Menú Mobile Desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <nav className="flex flex-col space-y-3 text-xs font-bold tracking-[0.2em] uppercase text-zinc-800">
              <Link
                href="/#novedades"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-zinc-100 hover:text-black"
              >
                Novedades
              </Link>
              <Link
                href="/#categorias"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-zinc-100 hover:text-black"
              >
                Colecciones &amp; Categorías
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-zinc-100 hover:text-black"
              >
                Catálogo Completo
              </Link>
              <Link
                href="/#destacados"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-zinc-100 hover:text-black"
              >
                Destacados
              </Link>
            </nav>

            <div className="pt-2">
              <a
                href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-bold tracking-[0.2em] uppercase text-white hover:bg-zinc-800 transition shadow-sm"
              >
                <MessageCircle className="size-4" />
                <span>Contacto por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
