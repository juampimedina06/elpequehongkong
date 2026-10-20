import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  FREE_TIER_DB_LIMIT_BYTES,
  FREE_TIER_STORAGE_LIMIT_BYTES,
  FREE_TIER_EGRESS_LIMIT_BYTES,
  FREE_TIER_MAU_LIMIT,
  resolveTrafficLightColor,
  resolveTrafficLightClassName,
  computeResourceUsageMetric,
  calculateInventoryValuation,
  extractLowStockAlerts,
  getDashboardMetrics,
} from '../services/dashboard.service'

describe('Work Unit 4 (TICKET-04): Free Tier Storage Monitor & Admin Dashboard KPIs', () => {
  describe('REQ-DASH-02: Free Tier Quotas & Traffic-Light Thresholds (Scenario 4.1)', () => {
    it('defines exact Supabase Free Tier byte and MAU limits', () => {
      assert.equal(FREE_TIER_DB_LIMIT_BYTES, 524_288_000) // 500 MB
      assert.equal(FREE_TIER_STORAGE_LIMIT_BYTES, 1_073_741_824) // 1 GB
      assert.equal(FREE_TIER_EGRESS_LIMIT_BYTES, 5_368_709_120) // 5 GB
      assert.equal(FREE_TIER_MAU_LIMIT, 50_000)
    })

    it('Scenario 4.1: assigns emerald (<70%), amber (70%-90%), and red (>90%) traffic-light colors and Tailwind classes', () => {
      // 45% of 500 MB = 235,929,600 bytes -> emerald
      const dbMetric = computeResourceUsageMetric(235_929_600, FREE_TIER_DB_LIMIT_BYTES)
      assert.equal(dbMetric.percentage, 45)
      assert.equal(dbMetric.color, 'emerald')
      assert.equal(resolveTrafficLightClassName(dbMetric.color), 'bg-emerald-500')

      // 78% of 1 GB -> amber
      const storageUsed78 = Math.round(FREE_TIER_STORAGE_LIMIT_BYTES * 0.78)
      const storageMetric = computeResourceUsageMetric(
        storageUsed78,
        FREE_TIER_STORAGE_LIMIT_BYTES
      )
      assert.equal(storageMetric.percentage, 78)
      assert.equal(storageMetric.color, 'amber')
      assert.equal(resolveTrafficLightClassName(storageMetric.color), 'bg-amber-500')

      // 94% simulated -> red
      const highMetric = computeResourceUsageMetric(
        Math.round(FREE_TIER_DB_LIMIT_BYTES * 0.94),
        FREE_TIER_DB_LIMIT_BYTES
      )
      assert.equal(highMetric.percentage, 94)
      assert.equal(highMetric.color, 'red')
      assert.equal(resolveTrafficLightClassName(highMetric.color), 'bg-red-600')

      // Boundary checks: 69.9% -> emerald, 70% -> amber, 90% -> amber, 90.1% -> red
      assert.equal(resolveTrafficLightColor(69.9), 'emerald')
      assert.equal(resolveTrafficLightColor(70), 'amber')
      assert.equal(resolveTrafficLightColor(90), 'amber')
      assert.equal(resolveTrafficLightColor(90.1), 'red')
    })
  })

  describe('REQ-DASH-03: Inventory Valuation & Low Stock Alerts', () => {
    it('calculates SUM(stock_quantity * COALESCE(price_override, base_price)) across active variants', () => {
      const variants = [
        {
          id: 'v-1',
          product_id: 'p-1',
          name: 'Taza Roja',
          sku: 'TAZ-ROJ',
          stock_quantity: 10,
          min_stock_alert: 3,
          price_override: null,
          is_active: true,
          product: {
            id: 'p-1',
            name: 'Taza Cerámica',
            slug: 'taza-ceramica',
            base_price: 4500,
            status: 'active' as const,
          },
        },
        {
          id: 'v-2',
          product_id: 'p-1',
          name: 'Taza Dorada Especial',
          sku: 'TAZ-DOR',
          stock_quantity: 4,
          min_stock_alert: 5,
          price_override: 6000,
          is_active: true,
          product: {
            id: 'p-1',
            name: 'Taza Cerámica',
            slug: 'taza-ceramica',
            base_price: 4500,
            status: 'active' as const,
          },
        },
        {
          id: 'v-3',
          product_id: 'p-2',
          name: 'Variante Inactiva',
          sku: 'INA-001',
          stock_quantity: 50,
          min_stock_alert: 5,
          price_override: 9000,
          is_active: false,
          product: {
            id: 'p-2',
            name: 'Plato Oriental',
            slug: 'plato-oriental',
            base_price: 8000,
            status: 'active' as const,
          },
        },
      ]

      // Expected: (10 * 4500) + (4 * 6000) = 45000 + 24000 = 69000
      const valuation = calculateInventoryValuation(variants)
      assert.equal(valuation, 69_000)
    })

    it('detects variants with stock_quantity <= min_stock_alert sorted by lowest stock first', () => {
      const variants = [
        {
          id: 'v-ok',
          product_id: 'p-1',
          name: 'Wok 30cm',
          sku: 'WOK-30',
          stock_quantity: 12,
          min_stock_alert: 3,
          price_override: null,
          is_active: true,
          product: {
            id: 'p-1',
            name: 'Wok Acero',
            slug: 'wok-acero',
            base_price: 25000,
            status: 'active' as const,
          },
        },
        {
          id: 'v-low',
          product_id: 'p-1',
          name: 'Wok 35cm',
          sku: 'WOK-35',
          stock_quantity: 3,
          min_stock_alert: 3,
          price_override: 29000,
          is_active: true,
          product: {
            id: 'p-1',
            name: 'Wok Acero',
            slug: 'wok-acero',
            base_price: 25000,
            status: 'active' as const,
          },
        },
        {
          id: 'v-zero',
          product_id: 'p-2',
          name: 'Farol Rojo Grande',
          sku: 'FAR-GDE',
          stock_quantity: 0,
          min_stock_alert: 4,
          price_override: null,
          is_active: true,
          product: {
            id: 'p-2',
            name: 'Farol Chino',
            slug: 'farol-chino',
            base_price: 9500,
            status: 'active' as const,
          },
        },
      ]

      const alerts = extractLowStockAlerts(variants)
      assert.equal(alerts.length, 2)
      assert.equal(alerts[0].variantId, 'v-zero')
      assert.equal(alerts[0].stockQuantity, 0)
      assert.equal(alerts[0].effectivePrice, 9500)
      assert.equal(alerts[1].variantId, 'v-low')
      assert.equal(alerts[1].stockQuantity, 3)
      assert.equal(alerts[1].effectivePrice, 29000)
    })
  })

  describe('REQ-DASH-01: Parallel Dashboard Loading & RPC Fallback (Scenario 4.2)', () => {
    it('loads storage stats via RPC and inventory metrics concurrently when RPC succeeds', async () => {
      const metrics = await getDashboardMetrics({
        fetchStorageStatsRpc: async () => ({
          data: {
            db_size_bytes: 235_929_600,
            db_limit_bytes: 524_288_000,
            storage_size_bytes: 536_870_912,
            storage_limit_bytes: 1_073_741_824,
            total_files_count: 142,
            egress_limit_bytes: 5_368_709_120,
            mau_limit: 50_000,
          },
          error: null,
        }),
        fetchFallbackCounts: async () => ({
          productImagesCount: 0,
          categoriesWithImagesCount: 0,
          bannersCount: 0,
          productsCount: 0,
          variantsCount: 0,
        }),
        fetchActiveProductsCount: async () => 18,
        fetchVariantsWithProducts: async () => [
          {
            id: 'v-1',
            product_id: 'p-1',
            name: 'Set Palillos Bambú',
            sku: 'PAL-01',
            stock_quantity: 2,
            min_stock_alert: 5,
            price_override: null,
            is_active: true,
            product: {
              id: 'p-1',
              name: 'Palillos Bambú',
              slug: 'palillos-bambu',
              base_price: 3200,
              status: 'active',
            },
          },
        ],
      })

      assert.equal(metrics.storage.isFallback, false)
      assert.equal(metrics.storage.db.percentage, 45)
      assert.equal(metrics.storage.db.color, 'emerald')
      assert.equal(metrics.storage.media.percentage, 50)
      assert.equal(metrics.storage.media.totalFilesCount, 142)
      assert.equal(metrics.kpis.activeProductsCount, 18)
      assert.equal(metrics.kpis.totalStockValuation, 6400)
      assert.equal(metrics.kpis.lowStockCount, 1)
      assert.equal(metrics.lowStockAlerts[0].sku, 'PAL-01')
    })

    it('Scenario 4.2: transparently computes fallback storage stats when get_system_storage_stats RPC fails', async () => {
      let fallbackCalled = false

      const metrics = await getDashboardMetrics({
        fetchStorageStatsRpc: async () => ({
          data: null,
          error: {
            message:
              'Could not find the function public.get_system_storage_stats without parameters in the schema cache',
          },
        }),
        fetchFallbackCounts: async () => {
          fallbackCalled = true
          return {
            productImagesCount: 30,
            categoriesWithImagesCount: 5,
            bannersCount: 3,
            productsCount: 15,
            variantsCount: 40,
          }
        },
        fetchActiveProductsCount: async () => 15,
        fetchVariantsWithProducts: async () => [],
      })

      assert.equal(fallbackCalled, true)
      assert.equal(metrics.storage.isFallback, true)
      assert.equal(metrics.storage.media.totalFilesCount, 38) // 30 + 5 + 3
      assert.ok(metrics.storage.media.usedBytes > 0)
      assert.ok(metrics.storage.db.usedBytes > 0)
      assert.equal(metrics.storage.db.limitBytes, FREE_TIER_DB_LIMIT_BYTES)
      assert.equal(metrics.storage.media.limitBytes, FREE_TIER_STORAGE_LIMIT_BYTES)
      assert.equal(metrics.kpis.activeProductsCount, 15)
    })
  })
})
