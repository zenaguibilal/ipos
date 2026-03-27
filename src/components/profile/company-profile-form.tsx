
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Save, Globe, Phone, Mail, MapPin, Hash, ShoppingBag, Coins, Scale, FileText, LogOut } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Separator } from '../ui/separator';

interface CompanyProfileFormProps {
    mode: 'company' | 'settings';
}

export function CompanyProfileForm({ mode }: CompanyProfileFormProps) {
    const { profile, isSettingsLoading } = useAppStore(state => ({
        profile: state.profile,
        isSettingsLoading: state.isSettingsLoading,
    }));
    const { updateProfile, logout } = useAppStore(state => state.actions);
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
            toast.success('Informations mises à jour avec succès.');
        } catch (err) {
            toast.error("Échec de la mise à jour.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isSettingsLoading) {
        return (
            <CardContent className="space-y-6 pt-6">
                {[...Array(mode === 'company' ? 4 : 2)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ))}
            </CardContent>
        );
    }

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-8 pt-8">
                {mode === 'company' ? (
                    <>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Localisation & Enseigne
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nom commercial</Label>
                                    <div className="relative">
                                        <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="Ex: Boutique iPOS" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest opacity-70">Adresse Siège</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="address" value={formState.address || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" placeholder="Ex: 12 Rue de la Liberté" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest opacity-70">Ville</Label>
                                    <Input id="city" value={formState.city || ''} onChange={handleInputChange} disabled={isSaving} className="h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest opacity-70">Code Postal</Label>
                                    <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} disabled={isSaving} className="h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest opacity-70">Pays</Label>
                                    <Input id="country" value={formState.country || ''} onChange={handleInputChange} disabled={isSaving} className="h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Contacts & Légalité
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest opacity-70">Téléphone Professionnel</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl font-mono bg-background/50 border-white/5 focus:border-primary/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-70">Email de Contact</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest opacity-70">Site Web / Portails</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving} placeholder="https://..." className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="vatNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70">NIF / Matricule Fiscal</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50 font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rcNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70">Registre du Commerce (RC)</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50 font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="artImposition" className="text-[10px] font-black uppercase tracking-widest opacity-70">Art. d'imposition (AI)</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="artImposition" value={formState.artImposition || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-12 rounded-xl bg-background/50 border-white/5 focus:border-primary/50 font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                                <Scale className="h-16 w-16 text-primary" />
                            </div>
                            <Label htmlFor="prix_pain" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" /> Prix Unitaire du Pain (DA)
                            </Label>
                            <Input 
                                id="prix_pain" 
                                type="number" 
                                step="0.1" 
                                value={formState.prix_pain || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving} 
                                className="h-14 text-3xl font-black rounded-2xl text-primary bg-background/50 border-primary/20 focus:border-primary"
                            />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Utilisé pour la génération automatique des factures de distribution quotidienne dans le module Boulangerie.
                            </p>
                        </div>

                        <div className="space-y-4 p-6 bg-orange-500/5 rounded-[2rem] border border-orange-500/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
                                <Coins className="h-16 w-16 text-orange-400" />
                            </div>
                            <Label htmlFor="goldPricePerGram" className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                                <Coins className="h-4 w-4" /> Cours de l'Or (24k) / g
                            </Label>
                            <Input 
                                id="goldPricePerGram" 
                                type="number" 
                                step="0.01" 
                                value={formState.goldPricePerGram || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving} 
                                className="h-14 text-3xl font-black rounded-2xl text-orange-400 bg-background/50 border-orange-500/20 focus:border-orange-500"
                            />
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Valeur de référence pour les commerces spécialisés. Ce montant impacte les calculs de valeur d'inventaire liés.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-white/5 p-6 flex justify-between border-t border-white/5">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={logout}
                    className="rounded-xl h-12 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 gap-2"
                >
                    <LogOut className="h-4 w-4" /> Fermer la Session
                </Button>
                <Button type="submit" disabled={isSaving} className="rounded-xl px-10 h-12 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Sauvegarder les réglages
                </Button>
            </CardFooter>
        </form>
    );
}
