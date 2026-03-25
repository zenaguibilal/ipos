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
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const { signIn } = useAppStore(state => state.actions);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('demo@ipos.com');
    const [password, setPassword] = useState('password');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(email, password);
            router.replace('/sell'); // Redirect on successful sign-in
        } catch (error: any) {
            toast.error(error.message || "La connexion a échoué.");
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
                        <TabsTrigger value="signup" disabled>S'inscrire (bientôt)</TabsTrigger>
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
                        {/* Content is empty as it's disabled */}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
