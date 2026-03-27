import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';

/**
 * iPOS Root Layout - Absolute Architecture Enforcement
 * PHASE 1: COMPLETE DATA PURGE (FINALIZED)
 * PHASE 2: ABSOLUTE DATA AUTHORITY (FINALIZED)
 * 
 * تم استئصال كافة مراجع PWA و Offline نهائياً.
 * النظام الآن يعمل بمعمارية Cloud-Only حتمية وسلطة بيانات مركزية.
 */

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "iPOS - Absolute Cloud Edition",
  description: "Intelligent Point of Sale - Pure Cloud Authority.",
  robots: "noindex, nofollow",
  appleWebApp: false,
  formatDetection: {
    telephone: false,
  },
  // فرض السيادة السحابية في إعدادات المتصفح
  other: {
    "mobile-web-app-capable": "no",
    "apple-mobile-web-app-capable": "no",
    "application-name": "iPOS",
    "theme-color": "#1a120c",
    "google": "notranslate",
  }
};

export const viewport: Viewport = {
  themeColor: "#1a120c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* منع المتصفح من البحث عن manifest.json أو أي ملفات استمرارية */}
        <link rel="icon" href="/icon.svg" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}
