
import { AppHeader } from '@/components/layout/header';
// AppSidebar is no longer used
// import { AppSidebar } from '@/components/layout/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col min-h-screen w-full">
          {/* <AppSidebar /> */}
          <div className="flex flex-col h-screen max-h-screen overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-auto bg-muted/40">{children}</main>
          </div>
      </div>
  );
}
