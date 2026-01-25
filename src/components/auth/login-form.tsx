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
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { getFirestore, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.04-5.07 2.04-4.35 0-7.92-3.58-7.92-8s3.57-8 7.92-8c2.38 0 4.04.98 5.2 2.1l3.06-3.05C18.44 1.54 15.65 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.04-4.92 12.04-12.24 0-1.04-.08-1.54-.12-2.04h-12z"></path>
    </svg>
);


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
      const redirectUrl = searchParams.get('redirectUrl') || '/sell';
      router.push(redirectUrl);
    }
  }, [user, router, searchParams]);

  const handleGoogleSignIn = () => {
    if (!auth) {
      setError("Le service d'authentification n'est pas disponible.");
      return;
    }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);

        if (additionalInfo?.isNewUser) {
           if (!user.email) {
                auth.signOut();
                setError("Votre compte Google n'a pas fourni d'adresse e-mail. Veuillez utiliser une autre méthode.");
                setIsLoading(false);
                return;
            }
          const firestore = getFirestore();
          const userDocRef = doc(firestore, 'users', user.uid);
          const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ['', ''];
          const lastName = lastNameParts.join(' ');
          
          setDocumentNonBlocking(userDocRef, {
            id: user.uid,
            firstName: firstName,
            lastName: lastName || firstName,
            email: user.email,
            phone: user.phoneNumber || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/popup-closed-by-user') {
            // User closed the popup, do nothing.
        } else if (errorCode === 'auth/account-exists-with-different-credential') {
            setError('Un compte existe déjà avec cet e-mail mais avec une méthode de connexion différente.');
        } else {
             setError("Une erreur est survenue lors de la connexion avec Google.");
            console.error(error);
        }
        setIsLoading(false);
      });
  };

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
      .then(() => {
          // On success, onAuthStateChanged listener will redirect.
          // No need to set isLoading to false here, component will unmount.
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
            <div className="lg:hidden flex justify-center items-center">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
                    <span className="text-3xl">🏪</span>
                    <span>iPOS</span>
                </Link>
            </div>
            <h1 className="text-3xl font-bold">Connexion</h1>
            <p className="text-balance text-muted-foreground">
                Entrez vos identifiants pour accéder à votre tableau de bord.
            </p>
        </div>
        {error && <p className="text-sm text-red-500 text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSubmit} className="grid gap-4">
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
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                OU CONTINUER AVEC
                </span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            <GoogleIcon />
            Google
        </Button>
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
