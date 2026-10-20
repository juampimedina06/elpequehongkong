'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import {
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  toggleBannerActiveAction,
} from '@/actions/banners/banners.actions'
import { compressImageToWebP } from '@/lib/image-compression'
import { uploadCatalogImage } from '@/services/storage.service'
import type { HomeBannerRow } from '@/types/database.types'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit3, Image as ImageIcon, Eye, EyeOff, Loader2 } from 'lucide-react'

interface BannersManagerProps {
  initialBanners: HomeBannerRow[]
}

export function BannersManager({ initialBanners }: BannersManagerProps) {
  const [banners, setBanners] = useState<HomeBannerRow[]>(initialBanners)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<HomeBannerRow | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const openCreateModal = () => {
    setEditingBanner(null)
    setTitle('')
    setSubtitle('')
    setLinkUrl('/catalogo')
    setCtaText('Ver catálogo')
    setDisplayOrder(banners.length + 1)
    setFile(null)
    setPreviewUrl(null)
    setModalOpen(true)
  }

  const openEditModal = (b: HomeBannerRow) => {
    setEditingBanner(b)
    setTitle(b.title)
    setSubtitle(b.subtitle || '')
    setLinkUrl(b.link_url || '')
    setCtaText(b.cta_text || '')
    setDisplayOrder(b.display_order)
    setFile(null)
    setPreviewUrl(b.image_url)
    setModalOpen(true)
  }

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleBannerActiveAction(id, !current)
      if (res.success) {
        setBanners((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b))
        )
        toast.success(res.message || 'Estado actualizado')
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este banner? Se borrará su imagen física de storage.')) return
    startTransition(async () => {
      const res = await deleteBannerAction(id)
      if (res.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id))
        toast.success(res.message || 'Banner eliminado')
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('El título es requerido')
      return
    }

    if (!editingBanner && !file) {
      toast.error('Debes seleccionar una imagen para el banner')
      return
    }

    setIsUploading(true)
    try {
      let imageUrl = editingBanner?.image_url || ''
      let storagePath = editingBanner?.storage_path || ''

      if (file) {
        const compressed = await compressImageToWebP(file, {
          maxWidth: 1200,
          quality: 0.8,
          maxSizeKB: 150,
        })
        const uploadResult = await uploadCatalogImage(compressed, 'banners')
        imageUrl = uploadResult.url
        storagePath = uploadResult.storage_path
      }

      startTransition(async () => {
        if (editingBanner) {
          const res = await updateBannerAction(editingBanner.id, {
            title,
            subtitle: subtitle || null,
            link_url: linkUrl || null,
            cta_text: ctaText || null,
            display_order: displayOrder,
            image_url: imageUrl,
            storage_path: storagePath,
          })
          if (res.success) {
            setBanners((prev) =>
              prev.map((b) => (b.id === editingBanner.id ? res.data : b))
            )
            toast.success(res.message || 'Banner actualizado')
            setModalOpen(false)
          } else {
            toast.error(res.error)
          }
        } else {
          const res = await createBannerAction({
            title,
            subtitle: subtitle || null,
            link_url: linkUrl || null,
            cta_text: ctaText || null,
            display_order: displayOrder,
            image_url: imageUrl,
            storage_path: storagePath,
            is_active: true,
          })
          if (res.success) {
            setBanners((prev) => [...prev, res.data].sort((a, b) => a.display_order - b.display_order))
            toast.success(res.message || 'Banner creado')
            setModalOpen(false)
          } else {
            toast.error(res.error)
          }
        }
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el banner')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Gestor de Portada &amp; Banners</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Administra los banners promocionales del carrusel principal en la página de inicio.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
        >
          <Plus className="size-3.5" />
          Nuevo Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center bg-white/50">
          <ImageIcon className="size-8 mx-auto text-zinc-300 mb-2" />
          <p className="text-xs font-medium text-zinc-700">No hay banners configurados</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Crea tu primer banner para mostrarlo en el carrusel de la portada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`rounded-xl border bg-white overflow-hidden shadow-xs flex flex-col justify-between transition ${
                banner.is_active ? 'border-zinc-200' : 'border-zinc-200/50 opacity-60'
              }`}
            >
              <div className="relative aspect-video w-full bg-zinc-100">
                {banner.image_url ? (
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-400">
                    <ImageIcon className="size-6" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      banner.is_active ? 'bg-emerald-500 text-white' : 'bg-zinc-600 text-white'
                    }`}
                  >
                    {banner.is_active ? 'Activo' : 'Oculto'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/60 text-white rounded-full">
                    #{banner.display_order}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1">
                <h3 className="font-semibold text-sm text-zinc-900 leading-snug line-clamp-1">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <div className="pt-1">
                    <span className="inline-block text-[11px] text-zinc-400 font-mono truncate max-w-full">
                      Link: {banner.link_url}
                    </span>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggle(banner.id, banner.is_active)}
                  disabled={isPending}
                  className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition"
                >
                  {banner.is_active ? (
                    <>
                      <EyeOff className="size-3.5" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" /> Activar
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(banner)}
                    disabled={isPending}
                    className="p-1 text-zinc-500 hover:text-zinc-900 transition rounded"
                    title="Editar"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    disabled={isPending}
                    className="p-1 text-zinc-400 hover:text-red-600 transition rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Título principal *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Nueva Colección de Verano"
                  className="w-full text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Subtítulo / Bajada</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Descuentos de hasta 20% en seleccionados"
                  className="w-full text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Enlace (URL)</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/catalogo?cat=verano"
                    className="w-full text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Texto Botón (CTA)</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ver productos"
                    className="w-full text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Orden de visualización</label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-24 text-xs rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Foto del Banner (.webp optimizado) {!editingBanner && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selected = e.target.files?.[0]
                    if (selected) {
                      setFile(selected)
                      setPreviewUrl(URL.createObjectURL(selected))
                    }
                  }}
                  className="w-full text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
                {previewUrl && (
                  <div className="mt-2 relative aspect-video w-full rounded-lg overflow-hidden border border-zinc-200">
                    <Image src={previewUrl} alt="Vista previa" fill className="object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending || isUploading}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 rounded-lg border border-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  {isUploading || isPending ? (
                    <>
                      <Loader2 className="size-3 animate-spin" /> Guardando...
                    </>
                  ) : editingBanner ? (
                    'Actualizar'
                  ) : (
                    'Publicar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
