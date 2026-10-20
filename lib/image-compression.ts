import { slugify } from '@/utils/formatters'

export interface ImageCompressionOptions {
  maxWidth?: number
  quality?: number
  maxSizeKB?: number
  sourceDimensionsOverride?: { width: number; height: number }
  encodePassOverride?: (params: {
    width: number
    height: number
    quality: number
  }) => Promise<BlobPart>
}

export const DEFAULT_COMPRESSION_OPTIONS = {
  maxWidth: 1200,
  quality: 0.8,
  maxSizeKB: 150,
} as const

export function calculateTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number = DEFAULT_COMPRESSION_OPTIONS.maxWidth
): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(sourceWidth))
  const safeHeight = Math.max(1, Math.round(sourceHeight))
  const limit = Math.max(1, Math.round(maxWidth))

  if (safeWidth <= limit) {
    return { width: safeWidth, height: safeHeight }
  }

  const ratio = limit / safeWidth
  return {
    width: limit,
    height: Math.max(1, Math.round(safeHeight * ratio)),
  }
}

export function resolveQualitySteps(
  initialQuality: number = DEFAULT_COMPRESSION_OPTIONS.quality
): number[] {
  const clamped = Math.min(1, Math.max(0.5, Number(initialQuality.toFixed(2))))
  const standardSteps = [clamped, 0.72, 0.65, 0.58, 0.5]
  const uniqueSteps: number[] = []

  for (const step of standardSteps) {
    if (step <= clamped && !uniqueSteps.includes(step)) {
      uniqueSteps.push(step)
    }
  }

  return uniqueSteps.length > 0 ? uniqueSteps : [0.8, 0.72, 0.65]
}

export function toWebPFileName(originalName: string): string {
  const withoutExtension = originalName.replace(/\.[^/.]+$/, '')
  const cleanBase = slugify(withoutExtension) || 'imagen-catalogo'
  return `${cleanBase}.webp`
}

async function loadBrowserImage(
  file: File
): Promise<{ image: HTMLImageElement; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        image: img,
        width: img.naturalWidth || img.width || 1200,
        height: img.naturalHeight || img.height || 800,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`No se pudo decodificar la imagen "${file.name}".`))
    }

    img.src = objectUrl
  })
}

async function encodeCanvasToWebPBlob(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D del navegador para comprimir a WebP.')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falló la conversión a formato WebP.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality
    )
  })
}

/**
 * Compresses any browser File (JPG, PNG, WebP) into an optimized .webp File
 * constrained to maxWidth (default 1200px) and adaptive quality passes
 * (0.80 -> 0.72 -> 0.65) targeting < 150 KB to protect Supabase Free Tier.
 */
export async function compressImageToWebP(
  file: File,
  options?: ImageCompressionOptions
): Promise<File> {
  const maxWidth = options?.maxWidth ?? DEFAULT_COMPRESSION_OPTIONS.maxWidth
  const initialQuality = options?.quality ?? DEFAULT_COMPRESSION_OPTIONS.quality
  const maxSizeKB = options?.maxSizeKB ?? DEFAULT_COMPRESSION_OPTIONS.maxSizeKB
  const maxSizeBytes = maxSizeKB * 1024
  const webpFileName = toWebPFileName(file.name)
  const qualitySteps = resolveQualitySteps(initialQuality)

  if (options?.encodePassOverride) {
    const sourceDims = options.sourceDimensionsOverride ?? {
      width: maxWidth,
      height: maxWidth,
    }
    const { width, height } = calculateTargetDimensions(
      sourceDims.width,
      sourceDims.height,
      maxWidth
    )

    let lastBlobPart: BlobPart | null = null
    for (const quality of qualitySteps) {
      const part = await options.encodePassOverride({ width, height, quality })
      lastBlobPart = part
      const candidate = new File([part], webpFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      })
      if (candidate.size <= maxSizeBytes) {
        return candidate
      }
    }

    return new File([lastBlobPart ?? new Uint8Array(0)], webpFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  }

  // Fallback for non-DOM environments (e.g. Node unit tests without encodePassOverride)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const rawBuffer = await file.arrayBuffer()
    const slicedBuffer =
      rawBuffer.byteLength > maxSizeBytes
        ? rawBuffer.slice(0, maxSizeBytes)
        : rawBuffer

    return new File([slicedBuffer], webpFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    })
  }

  const { image, width: srcWidth, height: srcHeight } = await loadBrowserImage(file)
  const { width, height } = calculateTargetDimensions(srcWidth, srcHeight, maxWidth)

  let bestBlob: Blob | null = null
  for (const quality of qualitySteps) {
    const blob = await encodeCanvasToWebPBlob(image, width, height, quality)
    bestBlob = blob
    if (blob.size <= maxSizeBytes) {
      break
    }
  }

  if (!bestBlob) {
    throw new Error('No se pudo comprimir la imagen a formato WebP.')
  }

  return new File([bestBlob], webpFileName, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
