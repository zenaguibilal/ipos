import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';

/**
 * iPOS Root Layout - Absolute Architecture Enforcement
 * PHASE 1: COMPLETE DATA PURGE (FINALIZED)
 * 
 * تم استئصال كافة مراجع PWA و Offline.
 * النظام الآن يعمل بمعمارية Cloud-Only حتمية.
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
  // منع أي محاولة لربط manifest أو أيقونات PWA
  other: {
    "mobile-web-app-capable": "no",
    "apple-mobile-web-app-capable": "no",
    "application-name": "iPOS",
  }
};

export const viewport: Viewport = {
  themeColor: "#1a120c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* منع المتصفح من البحث عن manifest.json نهائياً */}
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}
