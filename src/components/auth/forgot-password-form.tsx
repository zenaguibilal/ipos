'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
    <div className="grid gap-6">
        <div className="grid gap-2 text-center">
            <div className="lg:hidden flex justify-center items-center">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
                    <span className="text-3xl">🏪</span>
                    <span>iPOS</span>
                </Link>
            </div>
            <h1 className="text-3xl font-bold">Mot de passe oublié ?</h1>
            <p className="text-balance text-muted-foreground">
                Entrez votre e-mail pour recevoir un lien de réinitialisation.
            </p>
        </div>

        {message ? (
            <div className="text-center space-y-4">
                <p className="text-green-600 bg-green-500/10 p-3 rounded-md">{message}</p>
                <Button asChild className="w-full">
                    <Link href="/login">Retour à la connexion</Link>
                </Button>
            </div>
        ) : (
             <form onSubmit={handleSubmit} className="grid gap-4">
                {error && <p className="text-sm text-red-500 text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
                <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi...
                        </>
                    ) : "Envoyer l'e-mail de récupération"}
                </Button>
            </form>
        )}

        <div className="mt-4 text-center text-sm">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link href="/login" className="underline">
                Se connecter
            </Link>
        </div>
    </div>
  );
}
