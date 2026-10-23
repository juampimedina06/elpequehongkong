import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Shield, MapPin, Clock, CreditCard, ArrowUpRight } from 'lucide-react'
import { STORE_INFO } from './StoreLocationSection'

export function PublicFooter() {
  return (
    <footer className="border-t border-black bg-black text-white py-14 sm:py-16">
      <div className="mx-auto max-w-[1760px] px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12">
          
          {/* Columna 1: Marca & Descripción (4 columnas) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white">
                <Image
                  src="/assets/img/logo.png"
                  alt="El Pequeño Hong Kong"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="font-black text-lg sm:text-xl tracking-[0.25em] uppercase block">
                El Peque Hong Kong
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-sm">
              Catálogo digital interactivo y vitrina de novedades. Artículos importados seleccionados, bazar, accesorios y tendencias para tu día a día.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/5491100000000?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20el%20catálogo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/40 bg-zinc-900/60 hover:bg-white hover:text-black px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
              >
                <MessageCircle className="size-3.5" />
                <span>Atención por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Ubicación & Horarios en Córdoba (4 columnas) */}
          <div className="md:col-span-4 space-y-4">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400">
              Local &amp; Horarios
            </p>
            
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 mt-0.5 text-zinc-400" />
                <div>
                  <p className="font-bold text-white uppercase">{STORE_INFO.address}</p>
                  <a
                    href={STORE_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white underline underline-offset-2 mt-0.5"
                  >
                    <span>Ver en Google Maps</span>
                    <ArrowUpRight className="size-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Clock className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Horarios</span>
              </div>
              {STORE_INFO.schedule.map((s) => (
                <div key={s.days} className="text-[11px] leading-snug">
                  <span className="text-zinc-400">{s.days}:</span>{' '}
                  <span className="text-white font-mono">{s.hours}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <CreditCard className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pagos</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Efectivo · Transferencias bancarias · Tarjetas de crédito (+10%)
              </p>
            </div>
          </div>

          {/* Columna 3: Redes Sociales Oficiales (2 columnas) */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400">
              Redes Sociales
            </p>
            <ul className="space-y-2 text-xs font-semibold tracking-wider uppercase text-zinc-300">
              {STORE_INFO.socials.map((soc) => (
                <li key={soc.name}>
                  <a
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 hover:text-white transition"
                  >
                    <span>{soc.name}</span>
                    <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4: Navegación & Admin (2 columnas) */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400">
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
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/#ubicacion" className="hover:text-white transition">
                  Ubicación &amp; Local
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition text-[11px]"
                >
                  <Shield className="size-3" />
                  <span>Admin Panel</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Línea inferior de copyright y autoría */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono tracking-widest text-zinc-500 gap-4">
          <p>&copy; {new Date().getFullYear()} EL PEQUE HONG KONG. AV. ALEM 2874, CÓRDOBA.</p>
          
          <a
            href="https://codiarg.vercel.app/?utm_source=elpequehongkong&utm_medium=footer_watermark"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
            title="Diseño y desarrollo web por Codiarg"
          >
            <span className="text-[10px] tracking-normal font-sans text-zinc-400 group-hover:text-zinc-200">
              Desarrollado por
            </span>
            <div className="relative size-4 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
              <Image
                src="/assets/img/codiarg-logo.jpg"
                alt="Logo Codiarg"
                fill
                sizes="16px"
                className="object-cover"
              />
            </div>
            <span className="font-sans font-semibold tracking-wide text-zinc-200 group-hover:text-white">
              Codiarg
            </span>
            <ArrowUpRight className="size-3 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          </a>

          <p>VENTA Y RETIRO EN LOCAL COMERCIAL</p>
        </div>
      </div>
    </footer>
  )
}
