import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';

/**
 * iPOS Root Layout - Absolute Architecture Enforcement
 * PHASE 1: COMPLETE DATA PURGE
 * Eradicated all PWA, Manifest, and Offline references.
 * The system is now 100% Cloud-Only.
 */

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "iPOS - Absolute Cloud Edition",
  description: "Deterministic Cloud-Only Point of Sale. Absolute Data Authority enforced.",
  robots: "noindex, nofollow",
  // Kill all PWA indicators
  appleWebApp: false,
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
      <head>
        {/* Explicitly prevent manifest loading if any browser cache remains */}
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
