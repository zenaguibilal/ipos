'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, LogIn, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppActions, useAppStore } from '@/stores/appStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
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
    const session = useAppStore(state => state.session);

    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');

    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

    const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);
    const [forgotPassEmail, setForgotPassEmail] = useState('');
    const [isForgotPassLoading, setIsForgotPassLoading] = useState(false);
    const [forgotPassMessage, setForgotPassMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Hard redirect on session detection to ensure middleware picks up cookies
    useEffect(() => {
        if (session) {
            setLoginSuccess(true);
            const timer = setTimeout(() => {
                // Hard redirect to bypass Middleware sync delay
                window.location.href = '/dashboard';
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [session]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || loginSuccess) return;
        setError(null);

        if (!signInEmail || !signInPassword) {
            setError("L'email et le mot de passe sont requis.");
            return;
        }

        setIsLoading(true);
        try {
            await signIn(signInEmail, signInPassword);
            toast.success("Connexion réussie !");
        } catch (error: any) {
            setError(error.message || "La connexion a échoué.");
            setIsLoading(false);
        }
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || loginSuccess) return;
        setError(null);
        if (signUpPassword !== signUpConfirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);
        try {
            await signUp(signUpEmail, signUpPassword);
            toast.success("Compte créé avec succès !");
        } catch (error: any) {
            setError(error.message || "L'inscription a échoué.");
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
            setForgotPassMessage({type: 'success', text: "Lien de réinitialisation envoyé."});
        } catch (error: any) {
            setForgotPassMessage({type: 'error', text: error.message || "Une erreur est survenue."});
        } finally {
            setIsForgotPassLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')]"></div>

            <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in duration-700">
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-2">
                        <Image src="/icon.svg" alt="iPOS logo" width={56} height={56} className="drop-shadow-sm" priority />
                    </div>
                    <h1 className="text-4xl font-black text-primary tracking-tighter uppercase italic">iPOS</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Votre point de vente intelligent</p>
                </div>

                {loginSuccess ? (
                    <Card className="luxury-glass border-primary/20 text-center p-8 space-y-4">
                        <div className="flex justify-center">
                            <CheckCircle2 className="h-12 w-12 text-primary animate-bounce" />
                        </div>
                        <h2 className="text-xl font-bold">Session Identifiée</h2>
                        <p className="text-sm text-muted-foreground">Préparation de votre espace de travail...</p>
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary/50" />
                    </Card>
                ) : (
                    <Tabs defaultValue="signin" onValueChange={() => setError(null)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 luxury-glass h-12 p-1 bg-muted/20 border-white/5 mb-6">
                            <TabsTrigger value="signin" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">Se Connecter</TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">S'inscrire</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin" className="animate-in slide-in-from-bottom-4 duration-500">
                            <Card className="luxury-glass border-white/5 shadow-2xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Connexion</CardTitle>
                                    <CardDescription className="text-xs font-medium">Accédez à votre terminal de vente iPOS.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSignIn}>
                                    <CardContent className="space-y-5 pt-8">
                                        {error && (
                                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-[10px] font-bold uppercase">{error}</AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="email-in" className="text-[10px] font-black uppercase tracking-widest opacity-70">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                                <Input 
                                                    id="email-in" 
                                                    type="email" 
                                                    placeholder="votre@email.com" 
                                                    value={signInEmail} 
                                                    onChange={e => setSignInEmail(e.target.value)} 
                                                    required 
                                                    disabled={isLoading}
                                                    className="pl-10 h-12 rounded-xl bg-muted/30 border-white/5 focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password-in" className="text-[10px] font-black uppercase tracking-widest opacity-70">Mot de passe</Label>
                                                <Dialog open={isForgotPassOpen} onOpenChange={setIsForgotPassOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="link" type="button" className="p-0 h-auto text-[10px] font-black uppercase tracking-tighter text-primary hover:text-primary/80">
                                                            Oublié ?
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="luxury-glass border-white/10">
                                                        <form onSubmit={handleForgotPassword}>
                                                            <DialogHeader>
                                                                <DialogTitle className="font-black uppercase tracking-tight">Récupération</DialogTitle>
                                                                <DialogDescription className="text-xs">Un lien de réinitialisation sera envoyé.</DialogDescription>
                                                            </DialogHeader>
                                                            <div className="py-6 space-y-4">
                                                                {forgotPassMessage && (
                                                                    <Alert variant={forgotPassMessage.type === 'error' ? 'destructive' : 'default'} className="text-[10px] font-bold uppercase">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        <AlertDescription>{forgotPassMessage.text}</AlertDescription>
                                                                    </Alert>
                                                                )}
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="forgot-email" className="text-[10px] font-black uppercase opacity-70">Email</Label>
                                                                    <Input id="forgot-email" type="email" value={forgotPassEmail} onChange={e => setForgotPassEmail(e.target.value)} required disabled={isForgotPassLoading} className="h-12 rounded-xl" />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="submit" disabled={isForgotPassLoading} className="w-full bg-primary font-black uppercase text-xs h-12 rounded-xl">Envoyer</Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                                <Input 
                                                    id="password-in" 
                                                    type={showPassword ? 'text' : 'password'} 
                                                    placeholder="••••••••" 
                                                    value={signInPassword} 
                                                    onChange={e => setSignInPassword(e.target.value)} 
                                                    required 
                                                    disabled={isLoading}
                                                    className="pl-10 pr-10 h-12 rounded-xl bg-muted/30 border-white/5 focus:border-primary/50"
                                                />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="p-6">
                                        <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                                            Se Connecter
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-in slide-in-from-bottom-4 duration-500">
                           <Card className="luxury-glass border-white/5 shadow-2xl">
                                <CardHeader className="bg-primary/5 border-b border-white/5">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Inscription</CardTitle>
                                    <CardDescription className="text-xs font-medium">Rejoignez l'écosystème iPOS.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSignUp}>
                                    <CardContent className="space-y-4 pt-8">
                                        {error && <Alert variant="destructive" className="text-[10px] font-bold uppercase"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                                        <div className="space-y-2">
                                            <Label htmlFor="email-up" className="text-[10px] font-black uppercase tracking-widest opacity-70">Email</Label>
                                            <Input id="email-up" type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password-up" className="text-[10px] font-black uppercase tracking-widest opacity-70">Mot de passe</Label>
                                            <Input id="password-up" type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="confirm-password-up" className="text-[10px] font-black uppercase tracking-widest opacity-70">Confirmation</Label>
                                            <Input id="confirm-password-up" type="password" value={signUpConfirmPassword} onChange={e => setSignUpConfirmPassword(e.target.value)} required disabled={isLoading} className="h-12 rounded-xl" />
                                        </div>
                                    </CardContent>
                                    <div className="p-6">
                                        <Button type="submit" className="w-full h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer mon compte"}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
                
                <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                        Sécurisé par iPOS Security & Supabase Enterprise
                    </p>
                </div>
            </div>
        </div>
    );
}
