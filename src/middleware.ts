import { NextResponse, type NextRequest } from 'next/server'

// Ce middleware est une version minimale qui ne fait rien.
// Il est utilisé pour corriger une erreur 404 persistante causée par
// des problèmes avec l'intégration originale du middleware Supabase.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
