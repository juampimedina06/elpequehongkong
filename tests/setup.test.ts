import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCurrency,
  slugify,
  formatBytes,
  buildProductWhatsAppUrl,
} from '../utils/formatters'
import { resolveAuthRedirect } from '../lib/supabase/proxy'

describe('TICKET-01: Formatters & Base Setup', () => {
  it('slugify normalizes accents, symbols and spaces', () => {
    assert.equal(slugify('Muñecos & Figuras de Acción 2026!'), 'munecos-figuras-de-accion-2026')
    assert.equal(slugify('  Bazar / Cocina  '), 'bazar-cocina')
  })

  it('formatBytes formats storage metrics accurately', () => {
    assert.equal(formatBytes(0), '0 B')
    assert.equal(formatBytes(1024), '1 KB')
    assert.equal(formatBytes(524288000, 0), '500 MB')
    assert.equal(formatBytes(1073741824, 0), '1 GB')
  })

  it('formatCurrency returns ARS formatted price', () => {
    const formatted = formatCurrency(15000)
    assert.ok(formatted.includes('15.000'))
  })

  it('buildProductWhatsAppUrl builds direct inquiry link without cart', () => {
    const url = buildProductWhatsAppUrl({
      phone: '+54 9 11 2233-4455',
      productName: 'Termo Acero 1L',
      variantLabel: 'Negro Mate',
      sku: 'TER-01',
    })
    assert.ok(url?.startsWith('https://wa.me/5491122334455?text='))
    assert.ok(decodeURIComponent(url ?? '').includes('Termo Acero 1L'))
  })

  it('resolveAuthRedirect protects /admin and redirects logged-in admin from /login', () => {
    assert.equal(
      resolveAuthRedirect('/admin/productos', false),
      '/login?redirect=%2Fadmin%2Fproductos'
    )
    assert.equal(resolveAuthRedirect('/admin/productos', true), null)
    assert.equal(resolveAuthRedirect('/login', true), '/admin')
    assert.equal(resolveAuthRedirect('/catalogo', false), null)
  })
})
