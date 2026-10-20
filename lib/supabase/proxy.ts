import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export function resolveAuthRedirect(
  pathname: string,
  isAuthenticated: boolean
): string | null {
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/')

  if (isAdminRoute && !isAuthenticated) {
    return `/login?redirect=${encodeURIComponent(pathname)}`
  }

  if (isLoginRoute && isAuthenticated) {
    return '/admin'
  }

  return null
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/')

  // Fast-path: do not block or hit Auth API on public catalog routes
  if (!isAdminRoute && !isLoginRoute) {
    return supabaseResponse
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ''

  if (!supabaseUrl || !supabaseKey) {
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redirectTarget = resolveAuthRedirect(pathname, Boolean(user))

  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url))
  }

  return supabaseResponse
}
