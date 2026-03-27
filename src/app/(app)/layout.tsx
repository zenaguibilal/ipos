'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { StoreInitializer } from '@/components/layout/StoreInitializer';

/**
 * @fileOverview App Layout (Direct Access)
 * تم توحيد الهيكل لضمان ظهور التنقل بشكل دائم وحتمي.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreInitializer />
      <div className="flex h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 transition-all duration-500">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}
