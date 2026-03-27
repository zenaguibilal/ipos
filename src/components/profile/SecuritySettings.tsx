'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, KeyRound, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Separator } from '../ui/separator';

export function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        setIsLoading(true);
        try {
            // Simulated authority call
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Clé d'accès mise à jour.", {
                description: "Votre nouvelle identité sécurisée est désormais active."
            });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error("Échec de la mise à jour sécurisée.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="luxury-glass border-white/5 overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tight">Sécurité du Terminal</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Gestion des clés d'accès et protocoles d'authentification</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
                <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <KeyRound className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-widest">Modification de la Clé</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-60">Clé d'Accès Actuelle</Label>
                                    <div className="relative">
                                        <Input 
                                            type={showPasswords ? "text" : "password"} 
                                            value={formData.currentPassword}
                                            onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                                            className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40" 
                                            required 
                                        />
                                    </div>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-60">Nouvelle Clé</Label>
                                    <Input 
                                        type={showPasswords ? "text" : "password"} 
                                        value={formData.newPassword}
                                        onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                        className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40" 
                                        required 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase opacity-60">Confirmer la Clé</Label>
                                    <Input 
                                        type={showPasswords ? "text" : "password"} 
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40" 
                                        required 
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-[9px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                >
                                    {showPasswords ? <EyeOff className="h-3 w-3 mr-2" /> : <Eye className="h-3 w-3 mr-2" />}
                                    {showPasswords ? "Masquer" : "Afficher les clés"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-widest">Protocoles Actifs</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-bold">Chiffrement AES-256 Cloud</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Vos données sont protégées par les standards militaires de Google Cloud Platform.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-bold">Isolation de Session</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Chaque terminal possède un jeton d'accès unique et révocable.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5">
                                    <p className="text-[10px] font-black uppercase text-primary mb-2 italic">Note de Sécurité</p>
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                                        En cas de suspicion de compromission, modifiez immédiatement votre clé d'accès et contactez l'administrateur pour révoquer les sessions actives.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-10 bg-white/5 border-t border-white/5">
                    <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="h-14 px-12 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-[11px] tracking-[0.3em] gap-3 shadow-2xl shadow-primary/30"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                        Graver la Nouvelle Clé
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
