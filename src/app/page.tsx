
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
    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
      {user ? (
        <Button asChild size="lg">
          <Link href="/dashboard">Accéder à mon tableau de bord</Link>
        </Button>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/signup">Créer un compte</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/login">Se connecter</Link>
          </Button>
        </>
      )}
    </div>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6 bg-background">
      <div className="max-w-3xl">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Store className="h-16 w-16 text-primary" />
          <h1 className="text-6xl font-bold tracking-tight">iPOS</h1>
        </div>
        <p className="mt-4 text-2xl font-medium text-foreground">
          Votre point de vente, simplifié et intelligent.
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Gérez vos ventes, suivez votre inventaire, fidélisez vos clients et pilotez votre activité avec un tableau de bord puissant. Conçu pour être rapide, fiable et fonctionner même hors ligne.
        </p>
        <AuthButtons />
      </div>
    </div>
  );
}
