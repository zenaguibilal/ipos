import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/theme-provider';

const APP_NAME = "iPOS";
const APP_DEFAULT_TITLE = "iPOS - Point de Vente de Luxe";
const APP_TITLE_TEMPLATE = "%s - iPOS";
const APP_DESCRIPTION = "Votre solution de point de vente élégante, puissante et intuitive.";

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
    statusBarStyle: "default",
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
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  // Added for PWA manifest
  backgroundColor: "#1a120c",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
