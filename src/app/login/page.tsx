
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Building2, UserPlus, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';

/**
 * @fileOverview AUTHENTICATION GATEWAY (FINAL EDITION)
 * بوابة الدخول السيادية بنظام "Luxury Glass" المتطور.
 */

export default function AuthPage() {
    const router = useRouter();
    const { isAuthenticated, actions } = useAppStore(state => ({
        isAuthenticated: state.isAuthenticated,
        actions: state.actions
    }));
    
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await api.post<any>('auth/login', { email, password });
            actions.setAuth(data.user);
            await actions.fetchProfile();
            toast.success("Accès autorisé. Bienvenue sur iPOS.");
            router.push('/dashboard');
        } catch (error: any) {
            toast.error("Échec de l'authentification. Vérifiez vos identifiants.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            toast.error("Le nom de l'établissement est obligatoire.");
            return;
        }
        setIsLoading(true);
        try {
            await api.post('auth/signup', { email, password, companyName });
            toast.success("Votre compte souverain a été créé. Connectez-vous.");
            // Reset fields and switch to login tab
            const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
            loginTab?.click();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du déploiement du compte.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Brand Identity */}
                <div className="flex flex-col items-center text-center space-y-4 mb-8">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-card border-2 border-primary/20 flex items-center justify-center shadow-2xl luxury-glass group hover:border-primary/50 transition-all duration-500">
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS" 
                            width={56} 
                            height={56} 
                            priority 
                            className="group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                            iPOS SYSTEM
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
                            Absolute Cloud Authority
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 luxury-glass p-1 h-14 bg-muted/20 border-white/5 mb-8">
                        <TabsTrigger value="login" className="rounded-2xl font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all duration-300">
                            Connexion
                        </TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-2xl font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all duration-300">
                            Créer Compte
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleLogin}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-8 pt-8 px-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">
                                            Accès Sécurisé
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs font-medium opacity-70">
                                        Identifiez-vous pour accéder au centre de commandement.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-8 px-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">E-mail Professionnel</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-medium" 
                                                placeholder="admin@ipos.cloud" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Clé d'Accès</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="pl-12 pr-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-medium" 
                                                placeholder="••••••••" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox 
                                            id="remember" 
                                            checked={rememberMe} 
                                            onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                                        />
                                        <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest opacity-60 cursor-pointer select-none">
                                            Rester connecté sur ce terminal
                                        </label>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-8 mt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 gap-3 group"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Lancer le Système
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSignup}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-8 pt-8 px-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <UserPlus className="h-5 w-5 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">
                                            Nouvelle Instance
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs font-medium opacity-70">
                                        Déployez votre infrastructure iPOS en quelques secondes.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-8 px-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Nom de l'établissement</Label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                value={companyName} 
                                                onChange={e => setCompanyName(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-medium" 
                                                placeholder="Mon Commerce iPOS" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">E-mail Maître</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-medium" 
                                                placeholder="contact@commerce.dz" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Mot de Passe Souverain</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="pl-12 pr-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-medium" 
                                                placeholder="Min. 6 caractères" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-8 mt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary/20 gap-3 group"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Déployer mon iPOS
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex flex-col items-center space-y-4 pt-4">
                    <p className="text-center text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40">
                        Propulsé par iPOS Cloud Authority • Cryptage 256-bit
                    </p>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                        <CheckCircle2 className="h-3 w-3 text-primary/60" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Système Certifié Sécure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
