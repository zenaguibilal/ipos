
'use client';

import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { sendEmailVerification, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.04-5.07 2.04-4.35 0-7.92-3.58-7.92-8s3.57-8 7.92-8c2.38 0 4.04.98 5.2 2.1l3.06-3.05C18.44 1.54 15.65 0 12.48 0 5.88 0 0 5.88 0 12.48s5.88 12.48 12.48 12.48c7.02 0 12.04-4.92 12.04-12.24 0-1.04-.08-1.54-.12-2.04h-12z"></path>
    </svg>
);

function SignupFormComponent() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
  });
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    const checks = {
        length: newPassword.length >= 8,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
    setPasswordChecks(checks);
  };
  
  const handleGoogleSignUp = () => {
    if (!auth) {
        setError("Le service d'authentification n'est pas disponible.");
        return;
    }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            if (!user.email) {
                auth.signOut();
                setError("Votre compte Google n'a pas fourni d'adresse e-mail. Veuillez utiliser une autre méthode ou un autre compte Google.");
                setIsLoading(false);
                return;
            }

            const additionalInfo = getAdditionalUserInfo(result);
            
            if (additionalInfo?.isNewUser) {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, "users", user.uid);
                const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ["", ""];
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
            // onAuthStateChanged will handle the redirect
        })
        .catch((error) => {
            const errorCode = error.code;
            if (errorCode === 'auth/popup-closed-by-user') {
                 // User closed the popup, do nothing.
            } else if (errorCode === 'auth/account-exists-with-different-credential') {
                setError('Un compte existe déjà avec cet e-mail mais avec une méthode de connexion différente.');
            } else {
                setError("Une erreur est survenue lors de la connexion avec Google.");
                console.error(error.message);
            }
            setIsLoading(false);
        });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
    }
    
    const { length, upper, lower, number, symbol } = passwordChecks;
    if (!length || !upper || !lower || !number || !symbol) {
        setError('Le mot de passe doit respecter tous les critères de sécurité.');
        return;
    }


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
                    phone: phone,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                sendEmailVerification(userCredential.user);
                 // The onAuthStateChanged listener in FirebaseProvider will catch the new user
                 // and redirect them to the products page.
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
  
  const PasswordRequirement = ({ met, text }: { met: boolean, text: string }) => (
    <div className={cn("flex items-center text-xs", met ? "text-green-600" : "text-muted-foreground")}>
        <span className={cn("mr-2 font-bold text-lg leading-none", met ? "text-green-600" : "text-muted-foreground")}>{met ? '✓' : '•'}</span>
        {text}
    </div>
  );

  return (
      <div className="grid gap-4">
        <div className="grid gap-2 text-center">
            <div className="lg:hidden flex justify-center items-center">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
                    <span className="text-3xl">🏪</span>
                    <span>iPOS</span>
                </Link>
            </div>
            <h1 className="text-3xl font-bold">Créer un compte</h1>
            <p className="text-balance text-muted-foreground">
                Entrez vos informations pour créer votre compte iPOS
            </p>
        </div>
        {error && <p className="text-sm text-red-500 text-center bg-destructive/10 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSubmit} className="grid gap-4">
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
              <Label htmlFor="phone">Téléphone (Optionnel)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                />
                 {password.length > 0 && (
                    <div className="space-y-1 text-left mt-2">
                        <PasswordRequirement met={passwordChecks.length} text="Au moins 8 caractères" />
                        <PasswordRequirement met={passwordChecks.lower} text="Contient une lettre minuscule" />
                        <PasswordRequirement met={passwordChecks.upper} text="Contient une lettre majuscule" />
                        <PasswordRequirement met={passwordChecks.number} text="Contient un chiffre" />
                        <PasswordRequirement met={passwordChecks.symbol} text="Contient un symbole (ex: @, #, $)" />
                    </div>
                )}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input 
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                />
            </div>
            <div className="flex items-start space-x-2">
                <Checkbox 
                    id="terms" 
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                    <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                    J'ai lu et j'accepte les{" "}
                    <Link href="/terms" className="underline" target="_blank" rel="noopener noreferrer">
                        Conditions d'Utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link href="/privacy" className="underline" target="_blank" rel="noopener noreferrer">
                        Politique de Confidentialité
                    </Link>
                    .
                    </label>
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !agreeToTerms}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                    </>
                ) : 'Créer un compte'}
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
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
            <GoogleIcon />
            Google
        </Button>
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
