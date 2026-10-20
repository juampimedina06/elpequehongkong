import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export function resolveAdminSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): {
  url: string
  secretKey: string
  authOptions: { autoRefreshToken: false; persistSession: false }
} {
  const url =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL

  // Strict server-only key resolution: NEVER accept NEXT_PUBLIC_ secret keys
  const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !secretKey) {
    throw new Error(
      'Supabase Admin environment variables are missing (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)'
    )
  }

  return {
    url,
    secretKey,
    authOptions: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
}

export function createAdminClient(): SupabaseClient<Database> {
  const { url, secretKey, authOptions } = resolveAdminSupabaseConfig()

  return createClient<Database>(url, secretKey, {
    auth: authOptions,
  })
}
