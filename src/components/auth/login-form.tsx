'use client';

import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuth, sendEmailVerification } from 'firebase/auth';

function LoginFormComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get('redirectUrl') || '/dashboard';
      router.push(redirectUrl);
    }
  }, [user, router, searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!auth) {
      setError("Le service d'authentification n'est pas disponible.");
      return;
    }
    initiateEmailSignIn(auth, email, password)
        .catch((err: any) => {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-mail ou mot de passe incorrect.');
            } else {
                setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
                console.error(err);
            }
        });
  };

  if (isUserLoading || user) {
    return <div className="text-center">Chargement...</div>;
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez votre e-mail ci-dessous pour vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="ml-auto inline-block text-sm underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button type="submit" className="w-full">Se connecter</Button>
          <p className="mt-4 text-xs text-center text-gray-400">
            Vous n'avez pas de compte ?{" "}
            <Link href="/signup" className=" underline">
              Inscrivez-vous
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="text-center">Chargement...</div>}>
      <LoginFormComponent />
    </Suspense>
  )
}
