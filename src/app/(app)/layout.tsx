
import { AppHeader } from '@/components/layout/header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 flex flex-col">{children}</main>
      </div>
  );
}
