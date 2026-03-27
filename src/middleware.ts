import { NextResponse, type NextRequest } from 'next/server'

/**
 * @fileOverview THE SYSTEM SENTRY
 * تم تحديث القواعد للسماح بالوصول لصفحة تسجيل الدخول ومنع ملفات الـ PWA.
 */

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // السماح بالوصول لصفحة تسجيل الدخول (تمت إزالة التوجيه القسري للوحة التحكم)
  if (path === '/login') {
    return NextResponse.next();
  }

  // منع ملفات الـ PWA لفرض السيادة السحابية
  if (
    path.includes('manifest.json') || 
    path.includes('sw.js') || 
    path.includes('workbox-') || 
    path.includes('favicon.ico') ||
    path.endsWith('.webpush')
  ) {
    return new NextResponse(null, { 
        status: 404,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icon.svg).*)'
  ],
}
