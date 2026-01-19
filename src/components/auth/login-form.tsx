'use client';

import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { Loader2 } from 'lucide-react';


function LoginFormComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    setPersistence(auth, persistence)
      .then(() => {
        return initiateEmailSignIn(auth, email, password);
      })
      .catch((err: any) => {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
              setError('E-mail ou mot de passe incorrect.');
          } else {
              setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
              console.error(err);
          }
           setIsLoading(false);
      });
  };

  if (isUserLoading || user) {
    return <div className="text-center">Chargement...</div>;
  }

  return (
    <div className="grid gap-6">
        <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Connexion</h1>
            <p className="text-balance text-muted-foreground">
                Entrez vos identifiants pour accéder à votre tableau de bord.
            </p>
        </div>
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
                disabled={isLoading}
                />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                />
                <label
                    htmlFor="remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Se souvenir de moi
                </label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                    </>
                ) : 'Se connecter'}
            </Button>
        </form>
         <div className="mt-4 text-center text-sm">
            Vous n'avez pas de compte ?{" "}
            <Link href="/signup" className=" underline">
              Inscrivez-vous
            </Link>
        </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="text-center">Chargement...</div>}>
      <LoginFormComponent />
    </Suspense>
  )
}
