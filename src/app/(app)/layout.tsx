
import { AppHeader } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <AppSidebar />
          <div className="flex flex-col h-screen max-h-screen overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-auto bg-muted/40">{children}</main>
          </div>
      </div>
  );
}
