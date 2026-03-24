import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Si le client supabase doit définir un cookie, nous mettons à jour les cookies de la requête
          // et créons une nouvelle réponse avec les cookies mis à jour.
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Si le client supabase doit supprimer un cookie, nous mettons à jour les cookies de la requête
          // et créons une nouvelle réponse avec le cookie supprimé.
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // This line refreshes the session if it's expired.
  // It's commented out because it can cause routing issues (404s) in certain Next.js setups.
  // The session will still be managed and refreshed by the Supabase client when used in components.
  // await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Faire correspondre tous les chemins de requête, à l'exception de ceux qui commencent par :
     * - _next/static (fichiers statiques)
     * - _next/image (fichiers d'optimisation d'image)
     * - favicon.ico (fichier favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
