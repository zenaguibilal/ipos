
import { AppHeader } from '@/components/layout/header';
import { BottomNavBar } from '@/components/layout/bottom-navbar';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <FirebaseClientProvider>
        <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-col h-screen max-h-screen">
              <AppHeader />
              <main className="flex-1 overflow-auto bg-muted/40 pb-20 md:pb-0">{children}</main>
              <BottomNavBar />
            </div>
        </div>
      </FirebaseClientProvider>
  );
}
