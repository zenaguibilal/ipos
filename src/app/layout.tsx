import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'تطبيق جديد',
  description: 'تم إنشاؤه بواسطة Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body>
        <FirebaseClientProvider>
          <main>{children}</main>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
