
import { AppHeader } from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <FirebaseClientProvider>
        <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-col h-screen max-h-screen overflow-hidden">
              <AppHeader />
              <main className="flex-1 overflow-auto bg-muted/40">{children}</main>
            </div>
        </div>
      </FirebaseClientProvider>
  );
}
