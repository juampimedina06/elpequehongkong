import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveAuthRedirect,
  shouldVerifyEdgeSession,
  sanitizeRedirectPath,
} from '../lib/supabase/proxy'
import { config as proxyConfig, proxy } from '../proxy'
import { getAuthenticatedAdmin } from '../actions/auth/get-user'
import { authenticateAdminWithPassword } from '../actions/auth/auth'
import { ADMIN_NAV_ITEMS } from '../components/admin/AdminSidebar'

describe('Work Unit 2 (TICKET-02): Single-Admin Auth, Edge Interception & Admin Layout', () => {
  describe('REQ-AUTH-01, REQ-AUTH-02, REQ-AUTH-03: Scoped Edge Session Interception', () => {
    it('Scenario 2.1: redirects unauthenticated requests on /admin/:path* to /login?redirect=...', () => {
      assert.equal(
        resolveAuthRedirect('/admin', false),
        '/login?redirect=%2Fadmin'
      )
      assert.equal(
        resolveAuthRedirect('/admin/productos', false),
        '/login?redirect=%2Fadmin%2Fproductos'
      )
      assert.equal(
        resolveAuthRedirect('/admin/stock', false),
        '/login?redirect=%2Fadmin%2Fstock'
      )
    })

    it('Scenario 2.2: redirects authenticated admin from /login to /admin', () => {
      assert.equal(resolveAuthRedirect('/login', true), '/admin')
      assert.equal(resolveAuthRedirect('/admin/categorias', true), null)
    })

    it('Scenario 2.3: bypasses edge auth verification on public storefront routes', () => {
      assert.equal(shouldVerifyEdgeSession('/'), false)
      assert.equal(shouldVerifyEdgeSession('/catalogo'), false)
      assert.equal(shouldVerifyEdgeSession('/producto/taza-ceramica'), false)
      assert.equal(shouldVerifyEdgeSession('/admin'), true)
      assert.equal(shouldVerifyEdgeSession('/admin/productos'), true)
      assert.equal(shouldVerifyEdgeSession('/login'), true)

      assert.deepEqual(proxyConfig.matcher, ['/admin/:path*', '/login'])
      assert.equal(typeof proxy, 'function')
    })

    it('sanitizes redirect paths to prevent open-redirect vulnerabilities', () => {
      assert.equal(sanitizeRedirectPath('/admin/productos'), '/admin/productos')
      assert.equal(sanitizeRedirectPath('/admin/stock?tab=history'), '/admin/stock?tab=history')
      assert.equal(sanitizeRedirectPath('https://evil.example.com'), '/admin')
      assert.equal(sanitizeRedirectPath('//evil.example.com/admin'), '/admin')
      assert.equal(sanitizeRedirectPath('/login'), '/admin')
      assert.equal(sanitizeRedirectPath(''), '/admin')
      assert.equal(sanitizeRedirectPath(null), '/admin')
    })
  })

  describe('REQ-AUTH-04 & Threat Matrix: Admin Guard & Login Action Validation', () => {
    it('getAuthenticatedAdmin rejects unauthenticated callers and returns user when authenticated', async () => {
      await assert.rejects(
        async () => {
          await getAuthenticatedAdmin({
            auth: {
              getUser: async () => ({
                data: { user: null },
                error: null,
              }),
            },
          })
        },
        /No autorizado|Unauthorized/i
      )

      const mockAdminUser = { id: 'admin-uuid-1', email: 'admin@elpequehongkong.com' }
      const user = await getAuthenticatedAdmin({
        auth: {
          getUser: async () => ({
            data: { user: mockAdminUser },
            error: null,
          }),
        },
      })
      assert.equal(user.id, 'admin-uuid-1')
      assert.equal(user.email, 'admin@elpequehongkong.com')
    })

    it('authenticateAdminWithPassword validates credentials and returns structured ActionResult', async () => {
      const emptyResult = await authenticateAdminWithPassword(
        { email: '  ', password: '' },
        {
          auth: {
            signInWithPassword: async () => ({ data: {}, error: null }),
          },
        }
      )
      assert.equal(emptyResult.success, false)
      if (!emptyResult.success) {
        assert.match(emptyResult.error, /email|contraseña|credenciales/i)
      }

      const invalidResult = await authenticateAdminWithPassword(
        { email: 'admin@elpequehongkong.com', password: 'wrong-password', redirectTo: '/admin/stock' },
        {
          auth: {
            signInWithPassword: async () => ({
              data: { user: null },
              error: { message: 'Invalid login credentials' },
            }),
          },
        }
      )
      assert.equal(invalidResult.success, false)

      const validResult = await authenticateAdminWithPassword(
        {
          email: 'admin@elpequehongkong.com',
          password: 'correct-password',
          redirectTo: '/admin/productos',
        },
        {
          auth: {
            signInWithPassword: async () => ({
              data: { user: { id: 'admin-1', email: 'admin@elpequehongkong.com' } },
              error: null,
            }),
          },
        }
      )
      assert.equal(validResult.success, true)
      if (validResult.success) {
        assert.equal(validResult.data.redirectTo, '/admin/productos')
      }
    })

    it('defines all 5 required admin navigation destinations in ADMIN_NAV_ITEMS', () => {
      const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href)
      assert.deepEqual(hrefs, [
        '/admin',
        '/admin/productos',
        '/admin/categorias',
        '/admin/stock',
        '/admin/portada',
      ])
    })
  })
})
