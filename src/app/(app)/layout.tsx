'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col h-screen max-h-screen bg-muted/40">
        <AppHeader />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
        <BottomNavBar />
      </div>
  );
}
