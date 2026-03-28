
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
    Loader2, Lock, Mail, Building2, UserPlus, ShieldCheck, 
    ArrowRight, Eye, EyeOff, CheckCircle2, Globe, Server, 
    Info, Zap, ShieldAlert, Cpu, Activity, Fingerprint, 
    KeyRound, Terminal as TerminalIcon
} from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * @fileOverview AUTHENTICATION GATEWAY (SOVEREIGN EDITION - FINALIZED)
 * البوابة الرسمية والوحيدة للولوج إلى بنية iPOS السحابية.
 * تم إتمام المنطق، تحسين الحماية، وصقل الواجهة الزجاجية الفاخرة.
 */

// Validation Schemas
const loginSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    password: z.string().min(6, "La clé d'accès بايد تحتوي على 6 رموز على الأقل"),
});

const signupSchema = z.object({
    email: z.string().email("Format d'email invalide"),
    password: z.string().min(6, "La clé d'accès بايد تحتوي على 6 رموز على الأقل"),
    confirmPassword: z.string(),
    companyName: z.string().min(2, "Le nom de l'établissement est trop court"),
    agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: "Vous devez accepter les conditions de souveraineté" }),
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les clés d'accès ne correspondent pas",
    path: ["confirmPassword"],
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
    const [terminalId, setTerminalId] = useState('INIT-NODE-0000');
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Set Terminal ID on mount to avoid hydration mismatch
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const platform = window.navigator.platform.substring(0, 3).toUpperCase();
            const id = `iPOS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${platform}`;
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
            toast.success("Accès Autorisé", {
                description: "Initialisation du centre de commandement iPOS..."
            });
            router.push('/dashboard');
        } catch (error: any) {
            toast.error("Échec de l'Authentification", {
                description: "Vérifiez vos identifiants ou votre connexion au Cloud."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validation = signupSchema.safeParse({ email, password, confirmPassword, companyName, agreeToTerms });
        if (!validation.success) {
            toast.error(validation.error.errors[0].message);
            return;
        }

        setIsLoading(true);
        try {
            await api.post('auth/signup', { email, password, companyName });
            toast.success("Instance Déployée", {
                description: "Votre infrastructure iPOS est prête. Connectez-vous pour commencer."
            });
            setActiveTab('login');
        } catch (error: any) {
            toast.error("Échec du Déploiement", {
                description: error.message || "Une erreur est survenue lors de l'initialisation."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrength = () => {
        if (password.length === 0) return 0;
        if (password.length < 6) return 33;
        if (password.length < 10) return 66;
        return 100;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Sovereign Ambient Aura */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[150px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-xl space-y-10 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                {/* Header: System Identity */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                        <div className="h-32 w-32 rounded-[3rem] bg-card border-2 border-primary/20 flex items-center justify-center shadow-2xl luxury-glass group hover:border-primary/50 transition-all duration-700 hover:rotate-6 relative z-10">
                            <Image 
                                src="/icon.svg" 
                                alt="iPOS Sovereign" 
                                width={72} 
                                height={72} 
                                priority 
                                className="group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-7xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-foreground via-foreground to-foreground/30 bg-clip-text text-transparent leading-none">
                            iPOS <span className="text-primary">CORE</span>
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-primary/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/60">
                                Absolute Authority
                            </p>
                            <div className="h-px w-12 bg-primary/20" />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 luxury-glass p-2 h-16 bg-muted/20 border-white/5 mb-8">
                        <TabsTrigger 
                            value="login" 
                            className="rounded-2xl font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-500"
                        >
                            Authentification
                        </TabsTrigger>
                        <TabsTrigger 
                            value="signup" 
                            className="rounded-2xl font-black uppercase text-[11px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all duration-500"
                        >
                            Déploiement Cloud
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleLogin}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 p-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-2xl">
                                                <ShieldCheck className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Accès Maître</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">Identité Certifiée Requise</CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                                                <span className="text-[10px] font-black text-green-500 uppercase">Operational</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Identifiant Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-14 h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-base shadow-inner" 
                                                placeholder="admin@ipos.cloud" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center ml-1">
                                            <Label className="text-[11px] font-black uppercase tracking-widest opacity-60">Clé d'Accès Souveraine</Label>
                                            <button type="button" className="text-[9px] font-black uppercase text-primary/60 hover:text-primary transition-colors">Réinitialiser ?</button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="pl-14 pr-14 h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-base shadow-inner" 
                                                placeholder="••••••••" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 pt-2">
                                        <Checkbox 
                                            id="remember" 
                                            checked={rememberMe} 
                                            onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                                            className="h-5 w-5 rounded-lg border-white/10 data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 cursor-pointer select-none">
                                            Maintenir la Session Souveraine
                                        </label>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-10 flex flex-col gap-6">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading} 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl shadow-primary/20 gap-4 group overflow-hidden relative active:scale-95 transition-all"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>
                                                    Initialiser le Système
                                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-700" />
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-8 duration-700 outline-none">
                        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
                            <form onSubmit={handleSignup}>
                                <CardHeader className="bg-primary/5 border-b border-white/5 p-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            <UserPlus className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Déploiement Instance</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-50">Création d'Héritage iPOS</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Enseigne Commerciale</Label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                value={companyName} 
                                                onChange={e => setCompanyName(e.target.value)} 
                                                required 
                                                className="pl-14 h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold" 
                                                placeholder="Ex: Algiers Digital Store" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">E-mail de Gestion</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="pl-14 h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold" 
                                                placeholder="contact@commerce.dz" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Clé d'Accès</Label>
                                            <Input 
                                                type="password" 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                required 
                                                className="h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold" 
                                                placeholder="••••••" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Confirmation</Label>
                                            <Input 
                                                type="password" 
                                                value={confirmPassword} 
                                                onChange={e => setConfirmPassword(e.target.value)} 
                                                required 
                                                className="h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold" 
                                                placeholder="••••••" 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Password Strength Indicator */}
                                    {password && (
                                        <div className="space-y-2 animate-in fade-in duration-500">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-muted-foreground">Force du Flux</span>
                                                <span className={cn(
                                                    getPasswordStrength() < 66 ? "text-destructive" : "text-green-500"
                                                )}>
                                                    {getPasswordStrength() < 66 ? 'Vulnérable' : 'Sécurisé'}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        getPasswordStrength() < 66 ? "bg-destructive" : "bg-green-500"
                                                    )}
                                                    style={{ width: `${getPasswordStrength()}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start space-x-4 pt-4">
                                        <Checkbox 
                                            id="terms" 
                                            checked={agreeToTerms} 
                                            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)} 
                                            className="h-5 w-5 rounded-lg border-white/10 mt-1 data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-widest opacity-60 cursor-pointer leading-relaxed">
                                            J'accepte les conditions de déploiement و السيادة الرقمية الكاملة للمنظومة.
                                        </label>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-white/5 border-t border-white/5 p-10">
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading || !agreeToTerms} 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl shadow-primary/20 gap-4 group overflow-hidden relative active:scale-95 transition-all"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>
                                                    Déployer l'Infrastructure
                                                    <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-700" />
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer Badges & System Info */}
                <div className="flex flex-col items-center space-y-10 pt-10">
                    <div className="flex flex-wrap justify-center gap-6">
                        <SystemBadge icon={Globe} label="Cloud Native" />
                        <SystemBadge icon={Server} label="Multi-Region" />
                        <SystemBadge icon={ShieldCheck} label="AES-256" />
                        <SystemBadge icon={Cpu} label="Pure Authority" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 py-6 px-10 rounded-[2rem] bg-muted/10 border border-white/5 shadow-inner group">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-30 group-hover:opacity-60 transition-opacity">
                            <Activity className="h-3 w-3 text-primary animate-pulse" />
                            ID المحطة: {terminalId}
                        </div>
                        <div className="flex items-center gap-6 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Fingerprint className="h-5 w-5" />
                            <KeyRound className="h-5 w-5" />
                            <TerminalIcon className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Politique de Souveraineté</button>
                            </DialogTrigger>
                            <DialogContent className="luxury-glass border-primary/20 max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                        Décret de Souveraineté iPOS
                                    </DialogTitle>
                                    <DialogDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">Engagement de Confidentialité Absolue</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-6 text-sm font-medium leading-relaxed opacity-80 overflow-y-auto max-h-[50vh] pr-4">
                                    <p>1. <strong>Cloud Authority</strong>: Vos données résident exclusivement dans une infrastructure multi-région sécurisée. Aucune donnée n'est stockée localement de manière permanente.</p>
                                    <p>2. <strong>Chiffrement Maître</strong>: Chaque enregistrement financier est protégé par un algorithme AES-256 de classe militaire.</p>
                                    <p>3. <strong>Isolation des Rôles</strong>: L'accès au terminal est strictement hiérarchisé. Seul l'administrateur possède la clé de révocation globale.</p>
                                    <p>4. <strong>Audit de Flux</strong>: Chaque mouvement de stock ou transaction est horodaté et signé par le terminal émetteur.</p>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest border-primary/20">Compris و Accusé Réception</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <span className="h-1 w-1 rounded-full bg-white/10" />
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors" onClick={() => toast.info("Contactez l'Autorité Support iPOS pour assistance.")}>Support Terminal</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SystemBadge({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 shadow-xl hover:border-primary/20 transition-all hover:-translate-y-1">
            <Icon className="h-3.5 w-3.5 text-primary/60" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{label}</span>
        </div>
    );
}
