import { NextResponse, type NextRequest } from 'next/server'

/**
 * @fileOverview THE SYSTEM SENTRY (UNLEASHED)
 * تم رفع كافة القيود الأمنية. النظام الآن في وضع "الوصول المباشر".
 */

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. إبادة طلبات PWA/Offline فوراً
  if (
    path.includes('manifest.json') || 
    path.includes('sw.js') || 
    path.includes('workbox-') || 
    path.includes('favicon.ico')
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // السماح بكافة الطلبات دون تحقق
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icon.svg).*)'
  ],
}
