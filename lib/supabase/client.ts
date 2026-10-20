import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let browserClient: SupabaseClient<Database> | null = null

export function resolvePublicSupabaseConfig(
  env: Record<string, string | undefined> = process.env
): { url: string; key: string } {
  const url =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    'https://placeholder.supabase.co'

  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key'

  return { url, key }
}

export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient
  }

  const { url, key } = resolvePublicSupabaseConfig()

  browserClient = createBrowserClient<Database>(url, key)
  return browserClient
}
