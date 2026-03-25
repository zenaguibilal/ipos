import { type NextRequest, NextResponse } from 'next/server';

/**
 * This middleware is intentionally minimal to avoid routing conflicts observed
 * with more complex middleware setups in this offline-first architecture.
 *
 * It currently serves only to satisfy the Next.js requirement for a middleware export,
 * preventing a build error. It performs no operations and simply passes the request through.
 *
 * The session management and synchronization logic are handled client-side.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
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
