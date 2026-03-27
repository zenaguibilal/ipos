'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { 
    Loader2, Save, Globe, Phone, Mail, MapPin, Hash, 
    ShoppingBag, Coins, Scale, FileText, LogOut, 
    Briefcase, Building, Map, Landmark, ShieldCheck
} from 'lucide-react';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface CompanyProfileFormProps {
    mode: 'company' | 'settings';
}

export function CompanyProfileForm({ mode }: CompanyProfileFormProps) {
    const { profile, isSettingsLoading } = useAppStore(state => ({
        profile: state.profile,
        isSettingsLoading: state.isSettingsLoading,
    }));
    const { updateProfile, logout } = useAppStore(state => state.actions);
    const isManagerOrAdmin = useIsManagerOrAdmin();
    
    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormState(profile);
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isManagerOrAdmin) {
            toast.error("Votre rôle ne permet pas de modifier ces paramètres.");
            return;
        }
        
        setIsSaving(true);
        try {
            await updateProfile({
                companyName: formState.companyName || undefined,
                address: formState.address || undefined,
                city: formState.city || undefined,
                zipCode: formState.zipCode || undefined,
                country: formState.country || undefined,
                phone: formState.phone || undefined,
                email: formState.email || undefined,
                website: formState.website || undefined,
                vatNumber: formState.vatNumber || undefined,
                rcNumber: formState.rcNumber || undefined,
                artImposition: formState.artImposition || undefined,
                goldPricePerGram: formState.goldPricePerGram ? Number(formState.goldPricePerGram) : undefined,
                prix_pain: formState.prix_pain ? Number(formState.prix_pain) : undefined,
            });
            toast.success('Informations souveraines mises à jour avec succès.');
        } catch (err) {
            toast.error("Échec de la mise à jour des données.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isSettingsLoading) {
        return (
            <CardContent className="space-y-8 pt-8">
                {[...Array(mode === 'company' ? 5 : 2)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                ))}
            </CardContent>
        );
    }

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-10 pt-10">
                {mode === 'company' ? (
                    <>
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
                                    <Briefcase className="h-3.5 w-3.5" /> Identité & Enseigne
                                </h4>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-6 px-2 gap-1.5 text-[9px] font-black uppercase">
                                    <ShieldCheck className="h-3 w-3" />
                                    Accès: {profile?.role}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Nom commercial de l'établissement</Label>
                                    <div className="relative group">
                                        <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                                        <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" placeholder="Ex: Mon Établissement iPOS" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Adresse du Siège Social</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                                        <Input id="address" value={formState.address || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" placeholder="Ex: 12 Avenue des Martyrs" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Ville</Label>
                                    <div className="relative group">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="city" value={formState.city || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Code Postal</Label>
                                    <div className="relative group">
                                        <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Pays</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="country" value={formState.country || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 ml-1">
                                <Phone className="h-3.5 w-3.5" /> Contacts & Registres Légaux
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Téléphone Professionnel</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                                        <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl font-mono bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">E-mail Administratif</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                                        <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Site Web / Catalogue Digital</Label>
                                <div className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                                    <Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} placeholder="https://www.mon-commerce.com" className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="vatNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">NIF (Identifiant Fiscal)</Label>
                                    <div className="relative group">
                                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold font-mono uppercase" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="rcNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">N° Registre Commerce</Label>
                                    <div className="relative group">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold font-mono uppercase" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="artImposition" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Article d'Imposition</Label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30" />
                                        <Input id="artImposition" value={formState.artImposition || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-10 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 transition-all font-bold font-mono uppercase" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group hover:bg-primary/10 transition-all duration-500 shadow-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                                <Scale className="h-32 w-32 text-primary" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/20 rounded-2xl">
                                    <ShoppingBag className="h-6 w-6 text-primary" />
                                </div>
                                <Label htmlFor="prix_pain" className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                    Prix Unitaire du Pain (DA)
                                </Label>
                            </div>
                            <Input 
                                id="prix_pain" 
                                type="number" 
                                step="0.1" 
                                value={formState.prix_pain || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving || !isManagerOrAdmin} 
                                className="h-20 text-5xl font-black rounded-3xl text-primary bg-background/60 border-primary/20 focus:border-primary focus:ring-0 text-center shadow-inner tracking-tighter"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                                Ce prix est utilisé comme référence fondamentale pour la génération automatique des factures de distribution في وحدة المخبزة.
                            </p>
                        </div>

                        <div className="space-y-6 p-8 bg-orange-500/5 rounded-[2.5rem] border border-orange-500/10 relative overflow-hidden group hover:bg-orange-500/10 transition-all duration-500 shadow-xl">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                                <Coins className="h-32 w-32 text-orange-400" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-orange-500/20 rounded-2xl">
                                    <Coins className="h-6 w-6 text-orange-400" />
                                </div>
                                <Label htmlFor="goldPricePerGram" className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">
                                    Cours de l'Or (24k) / g
                                </Label>
                            </div>
                            <Input 
                                id="goldPricePerGram" 
                                type="number" 
                                step="0.01" 
                                value={formState.goldPricePerGram || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving || !isManagerOrAdmin} 
                                className="h-20 text-5xl font-black rounded-3xl text-orange-400 bg-background/60 border-orange-500/20 focus:border-orange-500 focus:ring-0 text-center shadow-inner tracking-tighter"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                                Valeur marchande de référence pour le calcul automatique du Nisab. Un réglage précis هو أساس تقييمات الزكاة الخاصة بك.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-white/5 p-8 flex flex-col sm:flex-row justify-between items-center border-t border-white/5 gap-6 mt-6 rounded-b-3xl">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={logout}
                    className="rounded-2xl h-14 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10 gap-3 w-full sm:w-auto shadow-sm"
                >
                    <LogOut className="h-5 w-5" /> Mettre Fin à la Session
                </Button>
                {isManagerOrAdmin && (
                    <Button type="submit" disabled={isSaving} className="rounded-2xl px-12 h-14 font-black uppercase text-[11px] tracking-[0.3em] gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto overflow-hidden relative group">
                        <span className="relative z-10 flex items-center gap-2">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Sauvegarder les Décrets
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:from-primary group-hover:to-primary/90 transition-all duration-500" />
                    </Button>
                )}
            </CardFooter>
        </form>
    );
}
