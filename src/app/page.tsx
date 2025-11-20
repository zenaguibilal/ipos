
'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

function AuthButtons() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="mt-8 h-10 w-48 rounded-md animate-pulse bg-gray-800" />;
  }

  return (
    <div className="mt-8 flex gap-4">
      {user ? (
        <Button asChild>
          <Link href="/dashboard">Aller au tableau de bord</Link>
        </Button>
      ) : (
        <>
          <Button variant="outline" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">S'inscrire</Link>
          </Button>
        </>
      )}
    </div>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <div className="flex items-center gap-4 mb-6">
        <Store className="h-16 w-16 text-primary" />
        <h1 className="text-5xl font-bold">iPOS</h1>
      </div>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        iPOS est votre solution de point de vente tout-en-un, conçue pour être simple, rapide et puissante. Gérez vos ventes, suivez votre inventaire, fidélisez vos clients et pilotez votre activité grâce à un tableau de bord intelligent. Le tout, même hors-ligne.
      </p>
      <AuthButtons />
    </div>
  );
}
