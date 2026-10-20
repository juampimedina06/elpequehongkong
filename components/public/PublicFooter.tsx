import Link from 'next/link'
import { MessageCircle, Shield } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="border-t border-black bg-black text-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12">
          {/* Columna de Marca */}
          <div className="md:col-span-6 space-y-3">
            <span className="font-black text-lg sm:text-xl tracking-[0.25em] uppercase block">
              El Peque Hong Kong
            </span>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-md">
              Catálogo digital interactivo y vitrina de novedades. Artículos seleccionados de bazar, decoración y tendencias con disponibilidad en tiempo real.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/40 bg-zinc-900/60 hover:bg-white hover:text-black px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
              >
                <MessageCircle className="size-3.5" />
                <span>Atención por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="md:col-span-3 space-y-2">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
              Navegación
            </p>
            <ul className="space-y-2 text-xs font-semibold tracking-wider uppercase text-zinc-300">
              <li>
                <Link href="/#novedades" className="hover:text-white transition">
                  Novedades
                </Link>
              </li>
              <li>
                <Link href="/#categorias" className="hover:text-white transition">
                  Colecciones
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-white transition">
                  Catálogo Completo
                </Link>
              </li>
              <li>
                <Link href="/#destacados" className="hover:text-white transition">
                  Destacados
                </Link>
              </li>
            </ul>
          </div>

          {/* Información y Acceso */}
          <div className="md:col-span-3 space-y-2">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-500 mb-2">
              Administración
            </p>
            <ul className="space-y-2 text-xs font-semibold tracking-wider uppercase text-zinc-300">
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 hover:text-white transition"
                >
                  <Shield className="size-3 text-zinc-500" />
                  <span>Panel Administrador</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea inferior de copyright */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono tracking-widest text-zinc-500 gap-4">
          <p>&copy; {new Date().getFullYear()} EL PEQUE HONG KONG. TODOS LOS DERECHOS RESERVADOS.</p>
          <p>EDICIÓN DIGITAL LIMITADA</p>
        </div>
      </div>
    </footer>
  )
}
