'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, Shield, Menu, X, MessageCircle, ArrowUpRight } from 'lucide-react'

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Transparente únicamente en la home antes de scrollear
  const isTransparent = isHome && !isScrolled

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Ticker Superior de Anuncios (Sin mención de envíos) */}
      <div
        className={`text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase py-2 px-4 text-center transition-colors duration-300 ${isTransparent
          ? 'bg-black/60 text-white backdrop-blur-xs border-b border-white/10'
          : 'bg-black text-white border-b border-black'
          }`}
      >
        <div className="inline-block animate-pulse">
          Av. Alem 2874, B° Villa Azalais, Córdoba · Lun a Vie 9:30-13 / 16-20:30 · Sáb 9:30-20:30 · Dom 10-13 · Efectivo, Transf., Crédito (+10%)
        </div>
      </div>

      {/* Barra Principal de Navegación 3 Columnas al estilo Kith */}
      <nav
        className={`transition-all duration-300 ${isTransparent
          ? 'bg-gradient-to-b from-black/80 via-black/35 to-transparent text-white border-b border-transparent'
          : 'bg-white/95 text-zinc-950 backdrop-blur-md border-b border-black/10 shadow-xs'
          }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1760px] items-center justify-between px-4 sm:px-8 lg:px-12">

          {/* COLUMNA IZQUIERDA: Menú Mobile & Enlaces Principales Desktop */}
          <div className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 -ml-2 transition ${isTransparent ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-600'
                }`}
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold tracking-[0.15em] uppercase">
              <Link
                href="/"
                className={`py-1 relative group transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-zinc-800 hover:text-black'
                  }`}
              >
                <span>Inicio</span>
                <span
                  className={`absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isTransparent ? 'bg-white' : 'bg-black'
                    }`}
                />
              </Link>
              <Link
                href="/catalogo"
                className={`py-1 relative group transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-zinc-800 hover:text-black'
                  }`}
              >
                <span>Catálogo</span>
                <span
                  className={`absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isTransparent ? 'bg-white' : 'bg-black'
                    }`}
                />
              </Link>
              <Link
                href="/#categorias"
                className={`py-1 relative group transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-zinc-800 hover:text-black'
                  }`}
              >
                <span>Categorías</span>
                <span
                  className={`absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isTransparent ? 'bg-white' : 'bg-black'
                    }`}
                />
              </Link>
              <Link
                href="/#ubicacion"
                className={`py-1 relative group transition-colors ${isTransparent ? 'text-white/90 hover:text-white' : 'text-zinc-800 hover:text-black'
                  }`}
              >
                <span>Dónde Estamos</span>
                <span
                  className={`absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isTransparent ? 'bg-white' : 'bg-black'
                    }`}
                />
              </Link>
            </div>
          </div>

          {/* COLUMNA CENTRAL: Logotipo Icónico Centrado */}
          <div className="flex items-center justify-center shrink-0">
            <Link
              href="/"
              className="group flex items-center gap-2.5 sm:gap-3 text-center"
            >
              <div
                className={`relative size-9 sm:size-11 shrink-0 overflow-hidden rounded-full border shadow-2xs group-hover:scale-105 transition-all duration-300 bg-white ${isTransparent ? 'border-white/40 ring-2 ring-white/20' : 'border-black/15'
                  }`}
              >
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
                <span
                  className={`font-black text-sm sm:text-base lg:text-lg tracking-[0.22em] uppercase leading-none transition-colors ${isTransparent ? 'text-white group-hover:text-zinc-200' : 'text-zinc-950 group-hover:text-zinc-700'
                    }`}
                >
                  El Peque Hong Kong
                </span>
              </div>
            </Link>
          </div>

          {/* COLUMNA DERECHA: Utilidades y Acciones (Search, WhatsApp, Admin) */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1">
            <Link
              href="/catalogo"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isTransparent ? 'text-white hover:bg-white/10' : 'text-zinc-800 hover:bg-zinc-100'
                }`}
              title="Buscar en el catálogo"
              aria-label="Buscar"
            >
              <Search className="size-4 stroke-[2]" />
              <span className="hidden sm:inline">Buscar</span>
            </Link>

            <a
              href="https://wa.me/5493516561535?text=¡Hola!%20Quería%20hacerles%20una%20consulta%20sobre%20el%20catálogo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-xs transition"
            >
              <MessageCircle className="size-4 fill-current" />
              <span>WhatsApp</span>
            </a>

            <Link
              href="/admin"
              className={`p-2 text-xs font-mono uppercase hidden md:inline-flex items-center gap-1 border-l pl-3 ml-1 transition opacity-70 hover:opacity-100 ${isTransparent
                ? 'text-zinc-300 hover:text-white border-white/20'
                : 'text-zinc-500 hover:text-zinc-900 border-zinc-200'
                }`}
              title="Panel de administración"
            >
              <Shield className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Menú Desplegable Mobile Claro y Accesible */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black bg-white text-zinc-950 px-5 py-6 space-y-6 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            <nav className="flex flex-col gap-3 text-sm font-bold uppercase tracking-wider text-zinc-950">
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-3 bg-zinc-900 text-white rounded-xl flex items-center justify-between"
              >
                <span>Ver Catálogo Completo</span>
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-2 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>Inicio</span>
                <ArrowUpRight className="size-3.5 text-zinc-400" />
              </Link>
              <Link
                href="/#categorias"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-2 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>Categorías de Productos</span>
                <ArrowUpRight className="size-3.5 text-zinc-400" />
              </Link>
              <Link
                href="/#ubicacion"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-2 border-b border-zinc-100 flex items-center justify-between"
              >
                <span>Dónde Estamos y Horarios</span>
                <ArrowUpRight className="size-3.5 text-zinc-400" />
              </Link>
            </nav>

            {/* Ficha Rápida del Local */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                Av. Alem 2874, B° Villa Azalais, Córdoba
              </p>
              <p className="text-[11px] text-zinc-600 font-medium">
                Lun-Vie 9:30-13 / 16-20:30 · Sáb 9:30-20:30 · Dom 10-13
              </p>
              <p className="text-[10px] text-zinc-500 font-mono pt-1">
                Pagos en el local: Efectivo · Transferencia · Tarjetas
              </p>
            </div>

            <div className="pt-1 space-y-2.5">
              <a
                href="https://wa.me/5493516561535?text=¡Hola!%20Quería%20hacerles%20una%20consulta%20sobre%20el%20catálogo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 text-xs font-bold tracking-wider uppercase hover:bg-[#20bd5a] rounded-xl shadow-xs transition"
              >
                <MessageCircle className="size-4.5 fill-current" />
                <span>Consultar por WhatsApp (351 656-1535)</span>
              </a>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 border border-zinc-200 py-2.5 text-[11px] font-medium uppercase text-zinc-500 hover:text-black rounded-xl transition"
              >
                <Shield className="size-3.5" />
                <span>Panel de Administración</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
