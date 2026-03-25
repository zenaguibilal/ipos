'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AuthPage() {
    const { signIn, signUp } = useAppStore(state => state.actions);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(email, password);
            // The layout effect will handle redirection
        } catch (error: any) {
            toast.error(error.message || "La connexion a échoué. Veuillez vérifier vos identifiants.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signUp(email, password);
            toast.success("Compte créé avec succès ! Veuillez vérifier votre email pour confirmer votre inscription.");
        } catch (error: any) {
            toast.error(error.message || "La création du compte a échoué.");
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
                                        <Input id="email-in" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-in">Mot de passe</Label>
                                        <Input id="password-in" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
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
                                <CardTitle>Inscription</CardTitle>
                                <CardDescription>Créez un nouveau compte pour commencer.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignUp}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email-up">Email</Label>
                                        <Input id="email-up" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password-up">Mot de passe</Label>
                                        <Input id="password-up" type="password" placeholder="6 caractères minimum" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                </CardContent>
                                 <div className="p-6 pt-0">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Créer le compte
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
