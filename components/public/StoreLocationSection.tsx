import Link from 'next/link'
import { MapPin, Clock, CreditCard, MessageCircle, ArrowUpRight, ExternalLink } from 'lucide-react'

// Redes y datos oficiales del comercio
export const STORE_INFO = {
  address: 'Av. Alem 2874, B° Villa Azalais, Córdoba Capital',
  addressShort: 'Av. Alem 2874, Córdoba',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Alem+2874,+Villa+Azalais,+Cordoba,+Argentina',
  embedMapUrl: 'https://maps.google.com/maps?q=Av.+Alem+2874,+Villa+Azalais,+Cordoba,+Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed',
  schedule: [
    { days: 'Lunes a Viernes', hours: '9:30 a 13:00 / 16:00 a 20:30' },
    { days: 'Sábados', hours: '9:30 a 20:30 (de corrido)' },
    { days: 'Domingos', hours: '10:00 a 13:00' },
  ],
  paymentMethods: [
    { title: 'Efectivo', detail: 'Pago directo en mostrador' },
    { title: 'Transferencia', detail: 'Bancos y billeteras virtuales' },
    { title: 'Crédito (+10%)', detail: 'Todas las tarjetas' },
  ],
  socials: [
    {
      name: 'Instagram',
      handle: '@elpequehongkong',
      url: 'https://www.instagram.com/elpequehongkong/',
    },
    {
      name: 'Facebook',
      handle: 'Bazar Mayorista Alem 2874',
      url: 'https://www.facebook.com/bazarmayoristaalem2874cordoba?mibextid=ZbWKwL&utm_source=ig&utm_medium=social&utm_content=link_in_bio',
    },
    {
      name: 'TikTok',
      handle: '@todo.lo.que.buscasss',
      url: 'https://www.tiktok.com/@todo.lo.que.buscasss?lang=en',
    },
  ],
}

export function StoreLocationSection() {
  return (
    <section id="ubicacion" className="space-y-8 scroll-mt-28">
      {/* Encabezado Editorial estilo Kith */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black pb-4 gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 block mb-1">
            04 / Local Comercial &amp; Atención
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
            Visitanos en Nuestro Local
          </h2>
        </div>
        <a
          href={STORE_INFO.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 hover:text-zinc-600 transition"
        >
          <span>Abrir en Google Maps</span>
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

      {/* Grid Principal: Info Editorial a la Izquierda + Mapa a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        
        {/* Columna Izquierda: Datos, Horarios, Pagos y Redes (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {/* Bloque Dirección */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-900">
                <MapPin className="size-4 stroke-[1.8]" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Dirección</span>
              </div>
              <p className="text-sm font-bold text-zinc-950 uppercase tracking-tight">
                Av. Alem 2874
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                B° Villa Azalais, Córdoba Capital
              </p>
              <a
                href={STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-900 underline underline-offset-4 pt-1 hover:text-zinc-600"
              >
                <span>Cómo llegar</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            {/* Bloque Horarios */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-900">
                <Clock className="size-4 stroke-[1.8]" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Horarios de Atención</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                {STORE_INFO.schedule.map((item) => (
                  <li key={item.days} className="flex flex-col">
                    <span className="font-bold text-zinc-900 uppercase text-[11px] tracking-wide">
                      {item.days}
                    </span>
                    <span className="font-mono text-zinc-600 text-[11px]">{item.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bloque Formas de Pago */}
          <div className="border-t border-black/10 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900">
              <CreditCard className="size-4 stroke-[1.8]" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Formas de Pago</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STORE_INFO.paymentMethods.map((pm) => (
                <div key={pm.title} className="p-3 bg-[#fafafa] border border-black/10">
                  <p className="text-xs font-black uppercase tracking-tight text-zinc-950">
                    {pm.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    {pm.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque Redes Sociales y Contacto Directo */}
          <div className="border-t border-black/10 pt-6 space-y-3">
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400 block">
              Redes Oficiales &amp; Canales
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {STORE_INFO.socials.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 border border-black bg-white hover:bg-black hover:text-white text-zinc-950 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors"
                >
                  <span>{soc.name}</span>
                  <ArrowUpRight className="size-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Mapa Interactivo estilo Minimalista (5 columnas) */}
        <div className="lg:col-span-5 relative w-full min-h-[360px] sm:min-h-[420px] bg-zinc-100 border border-black overflow-hidden shadow-xs">
          <iframe
            title="Ubicación de El Peque Hong Kong"
            src={STORE_INFO.embedMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full grayscale contrast-125 opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
          />
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 border border-black text-[10px] font-bold uppercase tracking-widest text-black pointer-events-none shadow-xs">
            Av. Alem 2874 · Córdoba
          </div>
        </div>

      </div>
    </section>
  )
}
