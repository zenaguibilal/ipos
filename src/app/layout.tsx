import type { Metadata } from 'next';
import Link from 'next/link';
import { Package2 } from 'lucide-react';
import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { MainNav } from '@/components/main-nav';
import { AppHeader } from '@/components/app-header';

export const metadata: Metadata = {
  title: 'iPOS - Intelligent Point of Sale',
  description:
    'A modern, integrated point-of-sale system for managing sales, products, customers, and suppliers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-background md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Package2 className="h-6 w-6 text-primary" />
                  <span className="">iPOS</span>
                </Link>
              </div>
              <div className="flex-1">
                <MainNav />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
