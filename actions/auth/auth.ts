'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizeRedirectPath } from '@/lib/supabase/proxy'

export type AuthActionResult =
  | {
      success: true
      data: {
        redirectTo: string
        email?: string | null
      }
    }
  | {
      success: false
      error: string
    }

export interface MinimalPasswordSignInClient {
  auth: {
    signInWithPassword: (credentials: {
      email: string
      password: string
    }) => Promise<{
      data: { user?: { id: string; email?: string | null } | null }
      error: { message: string } | null
    }>
  }
}

export async function authenticateAdminWithPassword(
  input: {
    email: string
    password: string
    redirectTo?: string | null
  },
  clientOverride?: MinimalPasswordSignInClient
): Promise<AuthActionResult> {
  const email = input.email.trim()
  const password = input.password

  if (!email || !password) {
    return {
      success: false,
      error: 'Ingresá tu email y contraseña de administrador.',
    }
  }

  const supabase = clientOverride ?? (await createClient())
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data?.user) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verificá tu correo y contraseña.',
    }
  }

  return {
    success: true,
    data: {
      redirectTo: sanitizeRedirectPath(input.redirectTo),
      email: data.user.email,
    },
  }
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/admin')

  const result = await authenticateAdminWithPassword({
    email,
    password,
    redirectTo,
  })

  if (result.success) {
    revalidatePath('/admin', 'layout')
  }

  return result
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
