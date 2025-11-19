'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Nouveau Projet</h1>
      <p className="mt-4 text-lg text-muted-foreground">Nous sommes prêts à commencer. Quelle est votre prochaine étape ?</p>
      <AuthButtons />
    </div>
  );
}
