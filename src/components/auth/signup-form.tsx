'use client';

import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';


function SignupFormComponent() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!auth) {
      setError("Le service d'authentification n'est pas disponible.");
      return;
    }
    
    setIsLoading(true);
    initiateEmailSignUp(auth, email, password)
        .then(userCredential => {
            if (userCredential.user) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, "users", userCredential.user.uid);
                setDocumentNonBlocking(userDocRef, {
                    id: userCredential.user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    email: userCredential.user.email,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                sendEmailVerification(userCredential.user);
                setMessage("Votre compte a été créé avec succès ! Nous avons envoyé un lien de vérification à votre adresse e-mail.");
                setIsLoading(false);
            }
        })
        .catch((err: any) => {
            if (err.code === 'auth/email-already-in-use') {
                setError('Cet e-mail est déjà utilisé.');
            } else if (err.code === 'auth/weak-password') {
                setError('Le mot de passe doit comporter au moins 6 caractères.');
            } else {
                setError("Une erreur s'est produite lors de la création du compte. Veuillez réessayer.");
                console.error(err);
            }
            setIsLoading(false);
        });
  };

  if (isUserLoading || user) {
    return <div className="text-center">Chargement...</div>;
  }
  
  if (message) {
      return (
          <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Vérifiez votre boîte mail</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button asChild className="mt-4 w-full">
                <Link href="/login">Retour à la connexion</Link>
              </Button>
          </div>
      )
  }


  return (
      <div className="grid gap-6">
        <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Créer un compte</h1>
            <p className="text-balance text-muted-foreground">
                Entrez vos informations pour créer votre compte iPOS
            </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4">
            {error && <p className="text-sm text-red-500 text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="first-name">Prénom</Label>
                <Input 
                    id="first-name" 
                    placeholder="Jean" 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="last-name">Nom</Label>
                <Input 
                    id="last-name" 
                    placeholder="Dupont" 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                />
                </div>
            </div>
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
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                    </>
                ) : 'Créer un compte'}
            </Button>
        </form>
         <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="underline">
                Se connecter
            </Link>
        </div>
      </div>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={<div className="text-center">Chargement...</div>}>
      <SignupFormComponent />
    </Suspense>
  )
}
