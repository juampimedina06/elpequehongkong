import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { resolvePublicSupabaseConfig } from './client'

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  const { url, key } = resolvePublicSupabaseConfig()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Handled via middleware / proxy when called inside a Server Component
        }
      },
    },
  })
}
