'use client';

import Link from 'next/link';

export default function RootPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
        <h1 className="text-2xl font-bold">Toutes les pages ont été supprimées.</h1>
        <p className="text-muted-foreground">
            Vous pouvez commencer à créer de nouvelles pages.
        </p>
        <Link href="/dashboard" className="mt-4 text-primary hover:underline">
            Aller au tableau de bord (vide)
        </Link>
    </div>
  );
}
