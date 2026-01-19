'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { FirebaseClientProvider, useUser } from '@/firebase/client-provider';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // These routes can be viewed publicly without the main app layout
  // if the user is not authenticated.
  const publicAppRoutes = ['/terms', '/privacy', '/about'];

  // Determine if the full app layout should be shown.
  // Show it if we are still loading auth state, if the user is logged in,
  // or if the current route is not one of the special public-facing routes.
  const showAppLayout = isUserLoading || !!user || !publicAppRoutes.includes(pathname);

  if (showAppLayout) {
    return (
      <div className="flex flex-col h-screen max-h-screen">
        <AppHeader />
        <main className="flex-1 overflow-auto bg-muted/40 pb-20 md:pb-0">{children}</main>
        <BottomNavBar />
      </div>
    );
  }

  // For unauthenticated users on specific public pages, render a minimal layout.
  return <main className="min-h-screen">{children}</main>;
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <FirebaseClientProvider>
        <div className="flex flex-col min-h-screen w-full">
            <AppLayoutContent>{children}</AppLayoutContent>
        </div>
      </FirebaseClientProvider>
  );
}
