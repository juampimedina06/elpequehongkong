import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedAdminUser {
  id: string
  email?: string | null
}

export interface MinimalAuthUserClient {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthenticatedAdminUser | null }
      error: { message: string } | null
    }>
  }
}

export async function getCurrentAdminUser(
  clientOverride?: MinimalAuthUserClient
): Promise<AuthenticatedAdminUser | null> {
  try {
    const supabase = clientOverride ?? (await createClient())
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
    }
  } catch {
    return null
  }
}

export async function getAuthenticatedAdmin(
  clientOverride?: MinimalAuthUserClient
): Promise<AuthenticatedAdminUser> {
  const user = await getCurrentAdminUser(clientOverride)
  if (!user) {
    throw new Error('No autorizado: se requiere sesión activa de administrador.')
  }
  return user
}
