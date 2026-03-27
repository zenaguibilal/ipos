'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { StoreInitializer } from '@/components/layout/StoreInitializer';

/**
 * @fileOverview App Layout (Direct Access)
 * تم حذف بوابات التحقق من الجلسة لسرعة الاستجابة.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreInitializer />
      <div className="flex h-screen flex-col bg-transparent">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
        <BottomNavBar />
      </div>
    </>
  );
}
