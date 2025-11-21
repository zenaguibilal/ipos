'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

function AuthButtons() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="mt-8 h-11 w-64 rounded-md animate-pulse bg-muted" />;
  }

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      {user ? (
        <Button asChild size="lg">
          <Link href="/dashboard">Accéder au tableau de bord</Link>
        </Button>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/signup">Créer un compte</Link>
          </Button>
          <Button variant="secondary" asChild size="lg">
            <Link href="/login">Se connecter</Link>
          </Button>
        </>
      )}
    </div>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between text-center p-6 bg-background">
      <div className="w-full"></div>
      <main className="flex flex-col items-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Store className="h-16 w-16 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">iPOS</h1>
        </div>
        <p className="mt-2 text-lg md:text-xl text-muted-foreground max-w-md">
          La solution de point de vente simple et efficace pour gérer votre commerce.
        </p>
        <AuthButtons />
      </main>
      <footer className="w-full text-center text-muted-foreground text-sm pb-4">
          <p className="mb-2 max-w-2xl mx-auto">iPOS est une solution de point de vente moderne conçue pour vous aider à gérer votre inventaire, vos ventes et vos clients avec simplicité et efficacité.</p>
          <p>Développé par zenagui bilal</p>
      </footer>
    </div>
  );
}
