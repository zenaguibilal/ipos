
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Building2, UserPlus, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * @fileOverview AUTHENTICATION GATEWAY (PHASE 11)
 * Luxury Glass compliant entry point for the iPOS System.
 */

export default function AuthPage() {
    const router = useRouter();
    const { setAuth, fetchProfile } = useAppStore(state => state.actions);
    const [isLoading, setIsLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await api.post<any>('auth/login', { email, password });
            setAuth(data.user);
            await fetchProfile();
            toast.success("Accès autorisé. Bienvenue sur iPOS.");
            router.push('/dashboard');
        } catch (error: any) {
            toast.error("Échec de l'authentification.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            toast.error("Nom de l'établissement requis.");
            return;
        }
        setIsLoading(true);
        try {
            await api.post('auth/signup', { email, password, companyName });
            toast.success("Compte souverain créé. Vous pouvez vous connecter.");
            // Switch to login automatically
            const tabs = document.querySelector('[data-value="login"]') as HTMLElement;
            tabs?.click();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-[2rem] bg-background border-2 border-primary/20 flex items-center justify-center shadow-2xl luxury-glass">
                        <Image src="/icon.svg" alt="iPOS" width={48} height={48} priority />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">iPOS SYSTEM</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Absolute Cloud Edition</p>
                    </div>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 luxury-glass p-1 h-12 bg-muted/20 border-white/5 mb-6">
                        <TabsTrigger value="login" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background transition-all">Connexion</TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background transition-all">Créer Compte</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleLogin}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Accès Sécurisé
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">Entrez vos identifiants souverains pour piloter votre commerce.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-1">E-mail Professionnel</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="admin@ipos.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-1">Clé d'Accès</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="••••••••" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-6 mt-2">
                                    <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lancer le Système"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSignup}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-primary" />
                                        Nouvel Écosystème
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium">Déployez votre infrastructure iPOS en quelques secondes.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-1">Nom de l'Établissement</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="Ma Boutique iPOS" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-1">E-mail de Contact</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="contact@ipos.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-1">Définir Mot de Passe</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="Minimum 6 caractères" />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-6 mt-2">
                                    <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2">
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Déployer mon iPOS"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                <p className="text-center text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                    Propulsé par iPOS Cloud Authority • Chiffrement 256-bit
                </p>
            </div>
        </div>
    );
}
