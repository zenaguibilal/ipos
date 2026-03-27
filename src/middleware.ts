import { NextResponse, type NextRequest } from 'next/server'

/**
 * @fileOverview THE SYSTEM SENTRY (UNLEASHED)
 * تم رفع كافة القيود الأمنية. النظام الآن في وضع "الوصول المباشر".
 * يفرض التحويل الفوري لطلبات الدخول ومنع كافة ملفات الـ PWA/Cache.
 */

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. إبادة طلبات الدخول فوراً وتوجيهها للمركز (Network Level Redirect)
  if (path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. إبادة طلبات PWA/Offline/Manifest فوراً ومنع المتصفح من أي محاولة كاش
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

  // فرض حتمية السحاب: إضافة رؤوس منع الكاش لكافة الطلبات
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
