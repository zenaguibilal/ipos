
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Building2, UserPlus, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2, Globe, Server, Info } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { z } from 'zod';

/**
 * @fileOverview AUTHENTICATION GATEWAY (SOVEREIGN EDITION)
 * البوابة الرسمية والوحيدة للولوج إلى بنية iPOS السحابية.
 */

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    password: z.string().min(6, "La clé d'accès doit contenir au moins 6 caractères"),
});

const signupSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    password: z.string().min(6, "La clé d'accès doit contenir au moins 6 caractères"),
    companyName: z.string().min(2, "Le nom de l'établissement est trop court"),
    agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: "Vous devez accepter les conditions d'utilisation" }),
    }),
});

export default function AuthPage() {
    const router = useRouter();
    const { isAuthenticated, actions } = useAppStore(state => ({
        isAuthenticated: state.isAuthenticated,
        actions: state.actions
    }));
    
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const [terminalId, setTerminalId] = useState('INIT');
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Set Terminal ID on mount to avoid hydration mismatch
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const id = btoa(window.navigator.userAgent).substring(0, 12).toUpperCase();
            setTerminalId(id);
        }
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Client-side validation
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
            toast.error(validation.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.post<any>('auth/login', { email, password });
            actions.setAuth(data.user);
            await actions.fetchProfile();
            toast.success("Accès autorisé", {
                description: "Initialisation du centre de commandement..."
            });
            router.push('/dashboard');
        } catch (error: any) {
            toast.error("Échec de l'authentification", {
                description: "Veuillez vérifier vos identifiants ou votre connexion."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Client-side validation
        const validation = signupSchema.safeParse({ email, password, companyName, agreeToTerms });
        if (!validation.success) {
            toast.error(validation.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            await api.post('auth/signup', { email, password, companyName });
            toast.success("Instance déployée", {
                description: "Votre compte souverain a été créé. Vous pouvez maintenant vous connecter."
            });
            setActiveTab('login');
        } catch (error: any) {
            toast.error("Échec du déploiement", {
                description: error.message || "Une erreur est survenue lors de la création de l'instance."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        toast.info("Récupération d'accès", {
            description: "Veuillez contacter l'administrateur système pour réinitialiser votre clé souveraine."
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />

            <div className="w-full max-w-lg space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                {/* Brand Identity */}
                <div className="flex flex-col items-center text-center space-y-6 mb-12">
                    <div className="h-28 w-28 rounded-[2.5rem] bg-card border-2 border-primary/20 flex items-center justify-center shadow-2xl luxury-glass group hover:border-primary/50 transition-all duration-700 hover:rotate-6">
                        <Image 
                            src="/icon.svg" 
                            alt="iPOS" 
                            width={64} 
                            height={64} 
                            priority 
                            className="group-hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-foreground via-foreground to-foreground/40 bg-clip-text text-transparent">
                            iPOS <span className="text-primary">SYSTEM</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3">
                            <span className="h-px w-8 bg-primary/30" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">
                                Absolute Cloud Authority
                            </p>
                            <span className="h-px w-8 bg-primary/30" />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 luxury-glass p-1.5 h-16 bg-muted/20 border-white/5 mb-10">
                        <TabsTrigger 
                            value="login" 
                            className="rounded-2xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-500"
                        >
                            Connexion
                        </TabsTrigger>
                        <TabsTrigger 
                            value="signup" 
                            className="rounded-2xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-500"
                        >
                            Déploiement
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleLogin}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-10 pt-10 px-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            <ShieldCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Accès Sécurisé</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-50">Authentification Maître</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-10 px-10">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Identifiant Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold" 
                                                placeholder="admin@ipos.cloud" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Clé d'Accès</Label>
                                            <button 
                                                type="button" 
                                                onClick={handleForgotPassword}
                                                className="text-[9px] font-black uppercase text-primary/60 hover:text-primary transition-colors"
                                            >
                                                Accès perdu ?
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="pl-12 pr-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold" 
                                                placeholder="••••••••" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 pt-2">
                                        <Checkbox 
                                            id="remember" 
                                            checked={rememberMe} 
                                            onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                                            className="rounded-lg border-white/10"
                                        />
                                        <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 cursor-pointer select-none">
                                            Maintenir la session active
                                        </label>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-10 mt-6">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-primary/20 gap-4 group overflow-hidden relative"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>
                                                    Initialiser le Système
                                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-500" />
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSignup}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 pb-10 pt-10 px-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            <UserPlus className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Nouvelle Instance</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-50">Déploiement Cloud iPOS</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-10 px-10">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Nom de l'établissement</Label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                value={companyName} 
                                                onChange={e => setCompanyName(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold" 
                                                placeholder="Mon Commerce iPOS" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">E-mail de Gestion</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold" 
                                                placeholder="contact@commerce.dz" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Clé d'Accès Souveraine</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="pl-12 pr-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold" 
                                                placeholder="Min. 6 caractères" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 pt-2">
                                        <Checkbox 
                                            id="terms" 
                                            checked={agreeToTerms} 
                                            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)} 
                                            className="rounded-lg border-white/10 mt-1"
                                        />
                                        <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-widest opacity-60 cursor-pointer leading-relaxed">
                                            J'accepte les conditions de déploiement et la politique de souveraineté des données.
                                        </label>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-10 mt-6">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading || !agreeToTerms} 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-primary/20 gap-4 group overflow-hidden relative"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>
                                                    Déployer l'Infrastructure
                                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-500" />
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer Badges */}
                <div className="flex flex-col items-center space-y-6 pt-8">
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                            <Globe className="h-3 w-3 text-primary/60" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Cloud Only Architecture</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                            <Server className="h-3 w-3 text-primary/60" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Sovereign Data Storage</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                            <CheckCircle2 className="h-3 w-3 text-primary/60" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">AES-256 Encryption</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-black tracking-[0.4em] opacity-30">
                        <Info className="h-3 w-3" />
                        Propulsé par iPOS Cloud Authority • Terminal ID: {terminalId}
                    </div>
                </div>
            </div>
        </div>
    );
}
