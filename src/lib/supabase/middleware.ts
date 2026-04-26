import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { isOwnerEmail } from '@/lib/auth'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const protectedPathPrefixes = ['/dashboard', '/control', '/analytics', '/settings', '/api']
  const isProtectedPath = protectedPathPrefixes.some((p) => pathname.startsWith(p))

  if (userError && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Not logged in → redirect to login for protected routes
  const authRequired = ['/dashboard', '/control', '/analytics', '/settings']
  if (authRequired.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Logged in → check profile status
  if (user && !pathname.startsWith('/pending') && !pathname.startsWith('/auth')) {
    const { data: rawProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    const profile = rawProfile as { role?: string | null; status?: string | null } | null

    // Pending users → redirect to waiting page
    if (profile?.status === 'pending' && !pathname.startsWith('/pending')) {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return NextResponse.redirect(url)
    }

    // Rejected users → sign out
    if (profile?.status === 'rejected') {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('error', 'rejected')
      return NextResponse.redirect(url)
    }

    // TaskMaster-only routes
    const taskmasterOnly = ['/control', '/analytics', '/settings']
    if (taskmasterOnly.some(p => pathname.startsWith(p)) && profile?.role !== 'taskmaster') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Owner-only API routes (role/status management and other sensitive operations)
    if (pathname.startsWith('/api/admin') && !isOwnerEmail(user.email)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
