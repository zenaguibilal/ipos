'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppActions } from '@/stores/appStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authService } from '@/services/auth.service';

export default function LoginPage() {
    const { signIn, signUp } = useAppActions();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Sign In State
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');

    // Sign Up State
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

    // Forgot Password State
    const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
    const [forgotPassEmail, setForgotPassEmail] = useState('');
    const [isForgotPassLoading, setIsForgotPassLoading] = useState(false);
    const [forgotPassMessage, setForgotPassMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);


    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!signInEmail || !signInPassword) {
            setError("L'email et le mot de passe sont requis.");
            return;
        }

        setIsLoading(true);
        try {
            await signIn(signInEmail, signInPassword);
            router.replace('/dashboard');
        } catch (error: any) {
            setError(error.message || "La connexion a échoué.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (signUpPassword !== signUpConfirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);
        try {
            await signUp(signUpEmail, signUpPassword);
            router.replace('/dashboard');
            toast.success("Compte créé avec succès ! Bienvenue.");
        } catch (error: any) {
            setError(error.message || "L'inscription a échoué.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotPassMessage(null);

        if (!forgotPassEmail) {
            setForgotPassMessage({type: 'error', text: "L'adresse email est requise."});
            return;
        }

        setIsForgotPassLoading(true);
        try {
            await authService.sendPasswordResetEmail(forgotPassEmail);
            setForgotPassMessage({type: 'success', text: "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé."});
        } catch (error: any) {
            setForgotPassMessage({type: 'error', text: error.message || "Une erreur est survenue."});
        } finally {
            setIsForgotPassLoading(false);
        }
    };


    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">iPOS</h1>
                    <p className="text-muted-foreground">Votre point de vente intelligent</p>
                </div>
                <Tabs defaultValue="signin" onValueChange={() => setError(null)}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Se Connecter</TabsTrigger>
                        <TabsTrigger value="signup">S'inscrire</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signin">
                        <Card>
                            <CardHeader>
                                <CardTitle>Connexion</CardTitle>
                                <CardDescription>Accédez à votre espace de vente.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignIn}>
                                <CardContent className="space-y-4">
                                     {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="email-in">Email</Label>
                                        <Input id="email-in" type="email" placeholder="nom@exemple.com" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password-in">Mot de passe</Label>
                                            <Dialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="link" type="button" className="p-0 h-auto text-xs">
                                                        Mot de passe oublié ?
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <form onSubmit={handleForgotPassword}>
                                                        <DialogHeader>
                                                            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                                                            <DialogDescription>
                                                                Entrez votre adresse e-mail ci-dessous et nous vous enverrons des instructions pour réinitialiser votre mot de passe.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="py-4 space-y-4">
                                                            {forgotPassMessage && (
                                                                <Alert variant={forgotPassMessage.type === 'error' ? 'destructive' : 'default'} className={forgotPassMessage.type === 'success' ? 'border-green-500 text-green-500 [&>svg]:text-green-500' : ''}>
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    <AlertDescription>{forgotPassMessage.text}</AlertDescription>
                                                                </Alert>
                                                            )}
                                                            <div className="space-y-2">
                                                                <Label htmlFor="forgot-email">Email</Label>
                                                                <Input id="forgot-email" type="email" placeholder="nom@exemple.com" value={forgotPassEmail} onChange={e => setForgotPassEmail(e.target.value)} required disabled={isForgotPassLoading}/>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="button" variant="secondary" onClick={() => setIsForgotPassOpen(false)} disabled={isForgotPassLoading}>Annuler</Button>
                                                            <Button type="submit" disabled={isForgotPassLoading}>
                                                                {isForgotPassLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Envoyer
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <div className="relative">
                                            <Input id="password-in" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required disabled={isLoading}/>
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-6 pt-0">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Se Connecter
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </TabsContent>
                    <TabsContent value="signup">
                       <Card>
                            <CardHeader>
                                <CardTitle>Créer un compte</CardTitle>
                                <CardDescription>Rejoignez-nous et commencez à gérer votre commerce.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignUp}>
                                <CardContent className="space-y-4">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="email-up">Email</Label>
                                        <Input id="email-up" type="email" placeholder="nom@exemple.com" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-up">Mot de passe</Label>
                                        <Input id="password-up" type="password" placeholder="••••••••" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required disabled={isLoading} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="confirm-password-up">Confirmer le mot de passe</Label>
                                        <Input id="confirm-password-up" type="password" placeholder="••••••••" value={signUpConfirmPassword} onChange={e => setSignUpConfirmPassword(e.target.value)} required disabled={isLoading} />
                                    </div>
                                </CardContent>
                                <div className="p-6 pt-0">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        S'inscrire
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
