import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // return await updateSession(request)
  // The above line is commented out to prevent middleware from running on every request.
  // This is a temporary measure to avoid potential issues with server-side rendering and API routes.
  // The session is still managed on the client side and through server components where needed.
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (icon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
