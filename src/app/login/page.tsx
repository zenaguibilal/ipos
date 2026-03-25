'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppActions } from '@/stores/appStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { signIn, signUp } = useAppActions();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    
    // Sign In State
    const [signInEmail, setSignInEmail] = useState('demo@ipos.com');
    const [signInPassword, setSignInPassword] = useState('password');

    // Sign Up State
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');


    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(signInEmail, signInPassword);
            router.replace('/sell'); // Redirect on successful sign-in
        } catch (error: any) {
            toast.error(error.message || "La connexion a échoué.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (signUpPassword !== signUpConfirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);
        try {
            await signUp(signUpEmail, signUpPassword);
            router.replace('/sell');
            toast.success("Compte créé avec succès ! Bienvenue.");
        } catch (error: any) {
            toast.error(error.message || "L'inscription a échoué.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">iPOS</h1>
                    <p className="text-muted-foreground">Votre point de vente intelligent</p>
                </div>
                <Tabs defaultValue="signin">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="email-in">Email</Label>
                                        <Input id="email-in" type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-in">Mot de passe</Label>
                                        <Input id="password-in" type="password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} required />
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
                                    <div className="space-y-2">
                                        <Label htmlFor="email-up">Email</Label>
                                        <Input id="email-up" type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-up">Mot de passe</Label>
                                        <Input id="password-up" type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="confirm-password-up">Confirmer le mot de passe</Label>
                                        <Input id="confirm-password-up" type="password" value={signUpConfirmPassword} onChange={e => setSignUpConfirmPassword(e.target.value)} required />
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
