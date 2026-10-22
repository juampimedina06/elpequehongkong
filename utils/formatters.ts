/**
 * Formatting and slug utilities for the dynamic catalog and inventory platform.
 */

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

/**
 * Formats a numeric price in Argentine Pesos (e.g., "$ 24.500").
 */
export function formatCurrencyARS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '$ 0'
  }
  return arsFormatter.format(amount)
}

/**
 * Formats a numeric price in US Dollars (e.g., "US$ 120").
 */
export function formatCurrencyUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'US$ 0'
  }
  return usdFormatter.format(amount)
}

/**
 * Formats a numeric price in Argentine Pesos (default catalog currency).
 */
export function formatCurrency(amount: number | null | undefined): string {
  return formatCurrencyARS(amount)
}

/**
 * Generates a URL-safe slug from any string (removes accents, punctuation, extra spaces).
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Formats bytes into human-readable units (B, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Formats an ISO date into short Spanish Argentine format.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Builds a direct WhatsApp inquiry link for a single product/variant (no cart).
 */
export function buildProductWhatsAppUrl(params: {
  phone?: string | null
  productName: string
  variantLabel?: string | null
  sku?: string | null
  productUrl?: string | null
}): string | null {
  const rawPhone =
    params.phone !== undefined
      ? params.phone
      : process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493516561535'
  let digits = (rawPhone ?? '').replace(/[^0-9]/g, '')
  if (digits.length === 10) {
    digits = `549${digits}`
  }
  if (!digits) return null

  const parts = [`Hola! Te consulto por el producto *${params.productName}*`]
  if (params.variantLabel) {
    parts.push(`Variante: ${params.variantLabel}`)
  }
  if (params.sku) {
    parts.push(`SKU: ${params.sku}`)
  }
  if (params.productUrl) {
    parts.push(`Link: ${params.productUrl}`)
  }

  const text = encodeURIComponent(parts.join(' — '))
  return `https://wa.me/${digits}?text=${text}`
}
