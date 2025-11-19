'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!auth) {
      setError("Le service d'authentification n'est pas disponible.");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Un e-mail de réinitialisation de mot de passe a été envoyé. Veuillez consulter votre boîte de réception."
      );
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("Aucun compte n'est associé à cet e-mail.");
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.");
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre e-mail ci-dessous et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {message && (
            <p className="text-sm text-green-500 text-center">{message}</p>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Envoi...' : "Envoyer l'e-mail de récupération"}
          </Button>
          <p className="text-xs text-center text-gray-400">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link href="/login" className="underline">
              Retour à la connexion
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
