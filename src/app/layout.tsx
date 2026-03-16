import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { PwaHandler } from '@/components/PwaHandler';

const APP_NAME = "iPOS";
const APP_DEFAULT_TITLE = "iPOS - Point de Vente";
const APP_TITLE_TEMPLATE = "%s - iPOS";
const APP_DESCRIPTION = "Application de point de vente hors ligne pour épicerie";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/icons/icon-512x512.png"]
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: ["/icons/icon-512x512.png"]
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffb74d",
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
          <meta name="msapplication-TileColor" content="#ffb74d" />
          <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
          <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors />
          <div id="receipt-for-print" className="hidden"></div>
          <PwaHandler />
        </ThemeProvider>
      </body>
    </html>
  );
}
