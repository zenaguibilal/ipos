import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Cet objet `response` est ce qui sera transmis au navigateur.
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // La méthode `set` est appelée par le client Supabase lorsqu'il doit
          // enregistrer la session dans un cookie.
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          // La méthode `remove` est appelée par le client Supabase lorsqu'il doit
          // supprimer le cookie de session.
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  // Ceci actualisera la session si elle a expiré
  await supabase.auth.getSession()

  // Ceci renverra la réponse avec le cookie mis à jour.
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
