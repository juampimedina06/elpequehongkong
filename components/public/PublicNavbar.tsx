'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Shield, Menu, X, MessageCircle, ArrowUpRight } from 'lucide-react'

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Ticker Superior Estilo Kith Announcement Bar */}
      <div className="bg-black text-white text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase py-2 px-4 text-center overflow-hidden border-b border-black">
        <div className="inline-block animate-pulse">
          Envíos a todo el país · Atención directa por WhatsApp · Nueva Colección
        </div>
      </div>

      {/* Navbar Editorial 3 Columnas al estilo Kith */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-black/10 transition-all">
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1760px] items-center justify-between px-4 sm:px-8 lg:px-12">
          
          {/* COLUMNA IZQUIERDA: Menú Mobile & Enlaces Principales Desktop */}
          <div className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-zinc-950 hover:text-zinc-600 transition"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-[11px] font-extrabold tracking-[0.2em] uppercase text-zinc-800">
              <Link
                href="/#novedades"
                className="hover:text-black transition-colors py-1 relative group"
              >
                <span>Novedades</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/#categorias"
                className="hover:text-black transition-colors py-1 relative group"
              >
                <span>Colecciones</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/catalogo"
                className="hover:text-black transition-colors py-1 relative group"
              >
                <span>Catálogo</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
              <Link
                href="/#destacados"
                className="hover:text-black transition-colors py-1 relative group"
              >
                <span>Destacados</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
            </nav>
          </div>

          {/* COLUMNA CENTRAL: Logotipo Icónico Centrado */}
          <div className="flex items-center justify-center shrink-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 sm:gap-3 text-center"
            >
              <div className="relative size-9 sm:size-11 shrink-0 overflow-hidden rounded-full border border-black/15 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/assets/img/logo.png"
                  alt="El Pequeño Hong Kong"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-black text-sm sm:text-base lg:text-lg tracking-[0.22em] uppercase text-zinc-950 group-hover:text-zinc-700 transition leading-none">
                  El Peque Hong Kong
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.3em] uppercase text-zinc-400 mt-1">
                  Est. 2026 · Curaduría &amp; Bazar
                </span>
              </div>
            </Link>
          </div>

          {/* COLUMNA DERECHA: Utilidades y Acciones (Search, WhatsApp, Admin) */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
            <Link
              href="/catalogo"
              className="p-2 text-zinc-800 hover:text-black transition"
              title="Buscar en el catálogo"
              aria-label="Buscar"
            >
              <Search className="size-4.5 stroke-[1.8]" />
            </Link>

            <a
              href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-black px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase text-white hover:bg-zinc-800 transition"
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp</span>
            </a>

            <Link
              href="/admin"
              className="p-2 text-zinc-400 hover:text-zinc-900 transition text-[10px] font-mono tracking-widest uppercase hidden md:inline-flex items-center gap-1 border-l border-zinc-200 pl-3 ml-1"
              title="Acceso panel de administración"
            >
              <Shield className="size-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Menú Desplegable Mobile Estilo Kith Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black bg-white px-5 py-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-4 text-xs font-bold tracking-[0.25em] uppercase text-zinc-950">
              <Link
                href="/#novedades"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>01 / Novedades</span>
                <ArrowUpRight className="size-3 text-zinc-400" />
              </Link>
              <Link
                href="/#categorias"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>02 / Colecciones</span>
                <ArrowUpRight className="size-3 text-zinc-400" />
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>03 / Catálogo Completo</span>
                <ArrowUpRight className="size-3 text-zinc-400" />
              </Link>
              <Link
                href="/#destacados"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>04 / Destacados &amp; Esenciales</span>
                <ArrowUpRight className="size-3 text-zinc-400" />
              </Link>
            </nav>

            <div className="pt-2 space-y-3">
              <a
                href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-black py-3.5 text-xs font-black tracking-[0.2em] uppercase text-white hover:bg-zinc-800 transition"
              >
                <MessageCircle className="size-4" />
                <span>Contacto Directo por WhatsApp</span>
              </a>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 border border-zinc-300 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600 hover:text-black transition"
              >
                <Shield className="size-3.5" />
                <span>Panel de Administración</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
