'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { StoreInitializer } from '@/components/layout/StoreInitializer';
import { useAppStore } from '@/stores/appStore';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, sessionLoading } = useAppStore();

  // The middleware protects this route. This client-side check only shows a
  // loading state while the session is being hydrated, preventing UI flicker.
  if (sessionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
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
