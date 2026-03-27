
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle, LogIn, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAppActions, useAppStore } from '@/stores/appStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

/**
 * @fileOverview THE AUTH GATEWAY (API Wall Purified)
 * تم تطهير الصفحة من أي خدمات عميل. الدخول يتم عبر جدار الحماية مباشرة.
 */

export default function LoginPage() {
    const { setSession } = useAppActions();
    const session = useAppStore(state => state.session);

    const [isLoading, setIsLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (session) {
            setLoginSuccess(true);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        }
    }, [session]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || loginSuccess) return;
        setError(null);
        setIsLoading(true);

        try {
            // Updated: Direct API Wall Call
            const sessionData = await api.post<any>('auth/login', { email, password });
            setSession(sessionData);
            toast.success("Authentification réussie. Synchronisation...");
        } catch (authError: any) {
            setError(authError.message === 'CREDENTIALS_REQUIRED' ? "Identifiants requis." : "Email ou mot de passe incorrect.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="w-full max-w-md z-10 space-y-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-2">
                        <Image src="/icon.svg" alt="logo" width={56} height={56} priority />
                    </div>
                    <h1 className="text-4xl font-black text-primary tracking-tighter uppercase italic">iPOS</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Absolute Cloud Edition</p>
                </div>

                {loginSuccess ? (
                    <Card className="luxury-glass border-primary/20 text-center p-8 space-y-4 shadow-2xl">
                        <CheckCircle2 className="h-12 w-12 text-primary animate-bounce mx-auto" />
                        <h2 className="text-xl font-bold uppercase">Accès Accordé</h2>
                        <p className="text-xs text-muted-foreground">Initialisation de la session sécurisée...</p>
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary/50" />
                    </Card>
                ) : (
                    <Card className="luxury-glass border-white/5 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-white/5 pb-6">
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Identification</CardTitle>
                            <CardDescription className="text-xs font-medium">Terminal POS Solaire • Autorité Sèche</CardDescription>
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
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Email</Label>
                                    <Input 
                                        type="email" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        required 
                                        className="h-12 rounded-xl bg-muted/30 border-white/5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Mot de passe</Label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? 'text' : 'password'} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            required 
                                            className="h-12 rounded-xl bg-muted/30 border-white/5 pr-10"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-6">
                                <Button type="submit" className="w-full h-14 rounded-2xl bg-primary font-black uppercase tracking-widest text-xs gap-3 shadow-xl" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                                    Se Connecter
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
