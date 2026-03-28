
'use client';

import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { StoreInitializer } from '@/components/layout/StoreInitializer';
import { useAppStore } from '@/stores/appStore';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * @fileOverview App Layout (Direct Access Guarded)
 * Fixed QUAL-02: Wrapped in ErrorBoundary.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isSettingsLoading, profile } = useAppStore(state => ({
    isAuthenticated: state.isAuthenticated,
    isSettingsLoading: state.isSettingsLoading,
    profile: state.profile
  }));

  // Show persistent loading if authenticated but data not yet synced
  if (isAuthenticated && !profile && isSettingsLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Synchronisation Souveraine en cours...
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <StoreInitializer />
      <div className="flex h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4 transition-all duration-500">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </ErrorBoundary>
  );
}
