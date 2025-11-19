
'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailVerification } from 'firebase/auth';

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
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Bienvenue, {user.displayName || user.email}!</CardTitle>
                <CardDescription>Ceci est votre tableau de bord. Utilisez la navigation de gauche pour commencer.</CardDescription>
            </CardHeader>
            <CardContent>
                <VerificationNotice />
                <p>C'est ici que les statistiques et les informations importantes sur votre activité seront affichées.</p>
            </CardContent>
        </Card>
    </div>
  );
}
