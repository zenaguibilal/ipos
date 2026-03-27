import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';

/**
 * iPOS Root Layout - Absolute Architecture Refactor
 * Purged of all Offline/PWA/Manifest dependencies.
 */

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: "iPOS",
  title: {
    default: "iPOS - Point de Vente Intelligent",
    template: "%s - iPOS",
  },
  description: "Application de point de vente SaaS complète avec autorité de بيانات مطلقة.",
  appleWebApp: null, // Purged
  formatDetection: {
    telephone: false,
  },
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
      <body className={inter.className}>
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}
