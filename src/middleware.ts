import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * @fileOverview Auth Middleware
 * Synchronizes Supabase auth session between server and client.
 * Explicitly handles cookie passing to ensure Next.js Server Components see the session.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: getUser() is required for security in middleware
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  
  // Exclude static files and PWA assets to prevent unnecessary redirection loops
  const isStaticFile = /\.(.*)$/.test(request.nextUrl.pathname) || 
                       request.nextUrl.pathname.startsWith('/_next') ||
                       request.nextUrl.pathname.includes('manifest.json') ||
                       request.nextUrl.pathname.includes('sw.js') ||
                       request.nextUrl.pathname.includes('icon.svg')

  // If user is not signed in and trying to access a protected route
  if (!user && !isAuthRoute && !isStaticFile) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is signed in and trying to access the login page
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js).*)',
  ],
}
