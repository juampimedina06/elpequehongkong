export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white py-8 text-center text-xs text-zinc-400">
      <div className="mx-auto max-w-6xl px-4 space-y-2">
        <p className="font-medium text-zinc-600">El Peque Hong Kong — Catálogo Digital Dinámico</p>
        <p className="text-[11px]">
          Vitrina promocional pública en tiempo real con stock actualizado. Precios sujetos a modificación sin previo aviso.
        </p>
        <p className="text-[10px] text-zinc-300 pt-2">
          &copy; {new Date().getFullYear()} El Peque Hong Kong. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
