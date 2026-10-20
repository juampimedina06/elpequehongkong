import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  formatCurrency,
  formatCurrencyARS,
  formatCurrencyUSD,
  slugify,
  formatBytes,
  formatDateTime,
  buildProductWhatsAppUrl,
} from '../utils/formatters'
import { resolvePublicSupabaseConfig } from '../lib/supabase/client'
import { resolveAdminSupabaseConfig, createAdminClient } from '../lib/supabase/admin'

describe('Work Unit 1 (TICKET-01): Foundation, Formatters, Supabase Clients & SQL Schema', () => {
  describe('REQ-FOUND-03: Domain Formatters (Scenario 1.2)', () => {
    it('formats ARS and USD currencies deterministically in es-AR locale', () => {
      const ars = formatCurrencyARS(14500)
      assert.ok(ars.includes('14.500'), `Expected ARS string to contain 14.500, got: ${ars}`)
      assert.equal(formatCurrency(14500), ars)
      assert.equal(formatCurrency(null), '$ 0')
      assert.equal(formatCurrency(undefined), '$ 0')

      const usd = formatCurrencyUSD(120)
      assert.ok(usd.includes('120'), `Expected USD string to contain 120, got: ${usd}`)
    })

    it('normalizes diacritics, symbols, and whitespace in slugify (Scenario 1.2)', () => {
      assert.equal(
        slugify('Muñeco Dragón Dorado #1 (Edición Especial!)'),
        'muneco-dragon-dorado-1-edicion-especial'
      )
      assert.equal(slugify('   ---Bazar & Decoración Oriental---   '), 'bazar-decoracion-oriental')
    })

    it('formats byte sizes and es-AR dates with safe fallbacks', () => {
      assert.equal(formatBytes(0), '0 B')
      assert.equal(formatBytes(-50), '0 B')
      assert.equal(formatBytes(153600, 0), '150 KB')
      assert.equal(formatBytes(524288000, 0), '500 MB')
      assert.equal(formatBytes(1073741824, 0), '1 GB')

      assert.equal(formatDateTime(null), '—')
      assert.equal(formatDateTime('invalid-date'), '—')
      const formattedDate = formatDateTime('2026-10-20T15:30:00.000Z')
      assert.ok(formattedDate.includes('2026'))
    })

    it('builds direct WhatsApp inquiry links without cart state', () => {
      const url = buildProductWhatsAppUrl({
        phone: '+54 9 11 5555-6666',
        productName: 'Set de Té Cerámica',
        variantLabel: 'Verde Jade',
        sku: 'TE-JADE-01',
        productUrl: 'https://elpequehongkong.com/producto/set-de-te-ceramica',
      })
      assert.ok(url?.startsWith('https://wa.me/5491155556666?text='))
      const decoded = decodeURIComponent(url ?? '')
      assert.ok(decoded.includes('*Set de Té Cerámica*'))
      assert.ok(decoded.includes('Variante: Verde Jade'))
      assert.ok(decoded.includes('SKU: TE-JADE-01'))
      assert.ok(decoded.includes('https://elpequehongkong.com/producto/set-de-te-ceramica'))

      assert.equal(
        buildProductWhatsAppUrl({
          phone: '',
          productName: 'Producto sin teléfono',
        }),
        null
      )
    })
  })

  describe('REQ-FOUND-02: Supabase Key Resolution & Service Role Isolation (Scenario 1.1)', () => {
    it('resolves NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY first and falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
      const primaryConfig = resolvePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_123',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJ_legacy_anon_456',
      })
      assert.equal(primaryConfig.url, 'https://demo.supabase.co')
      assert.equal(primaryConfig.key, 'sb_publishable_123')

      const fallbackConfig = resolvePublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJ_legacy_anon_456',
      })
      assert.equal(fallbackConfig.url, 'https://demo.supabase.co')
      assert.equal(fallbackConfig.key, 'eyJ_legacy_anon_456')
    })

    it('enforces server-only secret key in admin client and rejects NEXT_PUBLIC_ secret exposure', () => {
      assert.throws(() => {
        resolveAdminSupabaseConfig({
          NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
          NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'leaked_public_key',
        })
      }, /missing/i)

      const validAdmin = resolveAdminSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'srv_role_secret_789',
      })
      assert.equal(validAdmin.url, 'https://demo.supabase.co')
      assert.equal(validAdmin.secretKey, 'srv_role_secret_789')
      assert.deepEqual(validAdmin.authOptions, {
        autoRefreshToken: false,
        persistSession: false,
      })

      const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const prevSecret = process.env.SUPABASE_SECRET_KEY
      try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
        process.env.SUPABASE_SECRET_KEY = 'secret_test_key'
        const client = createAdminClient()
        assert.ok(client.from('products'))
      } finally {
        if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
        else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl
        if (prevSecret === undefined) delete process.env.SUPABASE_SECRET_KEY
        else process.env.SUPABASE_SECRET_KEY = prevSecret
      }
    })
  })

  describe('REQ-FOUND-01 & REQ-FOUND-04: Declarative SQL Schema, RLS & RPC Contracts', () => {
    it('defines complete initial SQL migration with pg_trgm, RLS policies, security_invoker view, and RPCs', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20261020000000_initial_catalog_schema.sql'
      )
      assert.equal(fs.existsSync(migrationPath), true, 'Initial SQL migration file must exist')
      const sql = fs.readFileSync(migrationPath, 'utf8')

      // Extensions & Tables
      assert.match(sql, /CREATE EXTENSION IF NOT EXISTS pg_trgm/i)
      for (const table of [
        'categories',
        'products',
        'product_variants',
        'product_images',
        'stock_movements',
        'home_banners',
      ]) {
        assert.match(
          sql,
          new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`, 'i'),
          `Missing table ${table}`
        )
        assert.match(
          sql,
          new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'),
          `Missing RLS enable on ${table}`
        )
      }

      // View with security_invoker = true
      assert.match(sql, /categories_with_count/i)
      assert.match(sql, /security_invoker\s*=\s*true/i)

      // RPC functions
      assert.match(sql, /FUNCTION public\.register_stock_movement/i)
      assert.match(sql, /FUNCTION public\.get_random_showcase_products/i)
      assert.match(sql, /FUNCTION public\.get_system_storage_stats/i)

      // Supabase RLS security rule: never use deprecated auth.role(), use TO anon / TO authenticated
      assert.doesNotMatch(sql, /auth\.role\(\)/i)
      assert.match(sql, /TO authenticated/i)
      assert.match(sql, /TO anon/i)
      assert.match(sql, /catalog-media/i)
    })
  })
})
