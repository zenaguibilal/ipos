
'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';

function VerificationNotice() {
  const { user } = useUser();
  const auth = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  const handleResendVerification = () => {
    if (user && auth) {
      sendEmailVerification(user)
        .then(() => {
          setMessage("Un nouvel e-mail de vérification a été envoyé. Veuillez consulter votre boîte de réception.");
        })
        .catch((error) => {
          setMessage("Une erreur s'est produite lors de l'envoi de l'e-mail. Veuillez réessayer.");
          console.error(error);
        });
    }
  };
  
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-yellow-500 bg-yellow-500/10 p-3 text-center text-sm">
      <p>Votre e-mail n'est pas vérifié. Veuillez consulter votre boîte de réception pour le lien de vérification.</p>
      <Button
        variant="link"
        className="h-auto p-0 text-yellow-400"
        onClick={handleResendVerification}
      >
        Renvoyer l'e-mail de vérification
      </Button>
      {message && <p className="mt-2 text-xs">{message}</p>}
    </div>
  );
}


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenue sur votre tableau de bord</CardTitle>
          <CardDescription>Vous êtes connecté avec succès.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerificationNotice />
          <p className="text-center text-muted-foreground">
            Votre e-mail : {user.email}
          </p>
          <div className="flex w-full flex-col gap-2">
             <Button asChild>
                <Link href="/sell">Aller à la page de vente</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/products">Gérer les produits</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/customers">Gérer les clients</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/profile">Aller au profil</Link>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
