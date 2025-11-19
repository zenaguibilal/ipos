import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ar">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          {children}
        </main>
      </body>
    </html>
  );
}
