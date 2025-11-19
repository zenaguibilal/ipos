import type { Metadata } from 'next';
import Link from 'next/link';
import { Package2 } from 'lucide-react';
import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { MainNav } from '@/components/main-nav';
import { AppHeader } from '@/components/app-header';
import { FirebaseClientProvider } from '@/firebase';
import { PasswordProvider } from '@/components/auth/password-provider';
import { PasswordGate } from '@/components/auth/password-gate';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'iPOS - Point de Vente Intelligent',
  description:
    'Un système de point de vente moderne et intégré pour la gestion des ventes, des produits, des clients et des fournisseurs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
       <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
        <PasswordProvider>
          <PasswordGate>
            <FirebaseClientProvider>
              <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <div className="hidden border-r bg-background md:block">
                  <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                      <Link href="/sell" className="flex items-center gap-2 font-semibold">
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
            </FirebaseClientProvider>
          </PasswordGate>
        </PasswordProvider>
        <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
