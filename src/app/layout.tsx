import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';

/**
 * iPOS Root Layout - Absolute Architecture Enforcement
 * PHASE 1: COMPLETE DATA PURGE
 * Erased all Offline/PWA/Manifest dependencies.
 */

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: "iPOS",
  title: {
    default: "iPOS - Absolute Cloud POS",
    template: "%s - iPOS",
  },
  description: "Deterministic Cloud-Only Point of Sale. Absolute Data Authority.",
  formatDetection: {
    telephone: false,
  },
  // Kill PWA support
  appleWebApp: false,
  other: {
    "mobile-web-app-capable": "no",
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
      <body className={inter.className}>
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}
