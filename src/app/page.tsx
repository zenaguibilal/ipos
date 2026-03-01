'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This is the root page of the application.
 * It automatically redirects the user to the main "/sell" page.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sell');
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement de l'application...</p>
      </div>
    </div>
  );
}
