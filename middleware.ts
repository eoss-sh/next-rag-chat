import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile if user exists
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Protected routes that require authentication and approval
  const protectedRoutes = ['/chat', '/upload', '/search']
  const adminRoutes = ['/admin']
  const authRoutes = ['/auth/login', '/auth/signup']
  const pendingRoute = '/pending-approval'
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isPendingRoute = request.nextUrl.pathname === pendingRoute

  // Redirect unauthenticated users from protected routes to login
  if (!user && (isProtectedRoute || isAdminRoute || isPendingRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle authenticated users
  if (user && profile) {
    const isApproved = profile.status === 'active'
    const isAdmin = profile.role === 'admin' && profile.status === 'active'

    // Redirect authenticated users away from auth pages
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = isApproved ? '/chat' : '/pending-approval'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect non-admin users away from admin routes
    if (isAdminRoute && !isAdmin) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = isApproved ? '/chat' : '/pending-approval'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect approved users away from pending page
    if (isPendingRoute && isApproved) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/chat'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect unapproved users from protected routes to pending
    if (isProtectedRoute && !isApproved) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/pending-approval'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}