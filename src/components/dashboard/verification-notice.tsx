
'use client';

import { useAuth, useUser } from '@/firebase';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendEmailVerification } from 'firebase/auth';

export function VerificationNotice() {
  const { user } = useUser();
  const auth = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResendVerification = () => {
    if (user && auth) {
      setIsLoading(true);
      setMessage(null);
      sendEmailVerification(user)
        .then(() => {
          setMessage("Un nouvel e-mail de vérification a été envoyé. Veuillez consulter votre boîte de réception.");
          setIsLoading(false);
        })
        .catch((error) => {
          setMessage("Une erreur s'est produite lors de l'envoi de l'e-mail. Veuillez réessayer.");
          console.error(error);
          setIsLoading(false);
        });
    }
  };
  
  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <div className="rounded-md border border-yellow-500 bg-yellow-500/10 p-3 text-center text-sm">
      <p>Votre e-mail n'est pas vérifié. Pour la sécurité de votre compte, veuillez consulter votre boîte de réception pour le lien de vérification.</p>
      <Button
        variant="link"
        className="h-auto p-0 text-yellow-400"
        onClick={handleResendVerification}
        disabled={isLoading}
      >
        {isLoading ? 'Envoi en cours...' : "Renvoyer l'e-mail de vérification"}
      </Button>
      {message && <p className="mt-2 text-xs">{message}</p>}
    </div>
  );
}
