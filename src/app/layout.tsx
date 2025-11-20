import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'iPOS',
  description: 'Votre solution de point de vente simple et efficace.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏪</text></svg>"
        />
      </head>
      <body className="min-h-screen">
        <FirebaseClientProvider>
          {children}
          <Toaster richColors />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
