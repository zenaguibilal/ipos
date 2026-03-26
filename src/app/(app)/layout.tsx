
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
  const { sessionLoading } = useAppStore();

  // StoreInitializer must be rendered unconditionally to be able to update the sessionLoading state.
  // The loading guard is now a ternary that decides whether to show the loader or the children.
  return (
    <>
      <StoreInitializer />
      {sessionLoading ? (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex h-screen flex-col bg-transparent">
          <AppHeader />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
          <BottomNavBar />
        </div>
      )}
    </>
  );
}
