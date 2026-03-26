
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2, Save, Globe, Phone, Mail, MapPin, Hash, ShoppingBag, Coins } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface CompanyProfileFormProps {
    mode: 'company' | 'settings';
}

export function CompanyProfileForm({ mode }: CompanyProfileFormProps) {
    const { profile, isSettingsLoading } = useAppStore(state => ({
        profile: state.profile,
        isSettingsLoading: state.isSettingsLoading,
    }));
    const { updateProfile } = useAppStore(state => state.actions);
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
            <CardContent className="space-y-6 pt-6">
                {mode === 'company' ? (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nom commercial</Label>
                                <div className="relative">
                                    <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest opacity-70">Adresse Siège</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input id="address" value={formState.address || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest opacity-70">Ville</Label><Input id="city" value={formState.city || ''} onChange={handleInputChange} disabled={isSaving} className="h-11 rounded-xl" /></div>
                                <div className="space-y-2"><Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest opacity-70">Code Postal</Label><Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} disabled={isSaving} className="h-11 rounded-xl" /></div>
                                <div className="space-y-2"><Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest opacity-70">Pays</Label><Input id="country" value={formState.country || ''} onChange={handleInputChange} disabled={isSaving} className="h-11 rounded-xl" /></div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Contacts & Légalité</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest opacity-70">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Public</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest opacity-70">Site Internet / Réseaux</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving} placeholder="https://..." className="pl-10 h-11 rounded-xl" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vatNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70">N° TVA / NIF</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rcNumber" className="text-[10px] font-black uppercase tracking-widest opacity-70">Registre de Commerce</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                        <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving} className="pl-10 h-11 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <Label htmlFor="prix_pain" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                                <ShoppingBag className="h-4 w-4" /> Prix de Vente du Pain (DA)
                            </Label>
                            <Input 
                                id="prix_pain" 
                                type="number" 
                                step="0.1" 
                                value={formState.prix_pain || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving} 
                                className="h-12 text-2xl font-black rounded-xl text-primary bg-background/50"
                            />
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Ce prix est utilisé pour générer automatiquement les factures de distribution quotidienne.</p>
                        </div>

                        <div className="space-y-2 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                            <Label htmlFor="goldPricePerGram" className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2 mb-2">
                                <Coins className="h-4 w-4" /> Cours de l'Or / Gramme (DA)
                            </Label>
                            <Input 
                                id="goldPricePerGram" 
                                type="number" 
                                step="0.01" 
                                value={formState.goldPricePerGram || ''} 
                                onChange={handleInputChange} 
                                disabled={isSaving} 
                                className="h-12 text-2xl font-black rounded-xl text-orange-400 bg-background/50"
                            />
                            <p className="text-[9px] text-muted-foreground mt-2 italic">Valeur de référence pour les commerces de bijouterie ou d'investissement.</p>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-white/5 p-4 flex justify-end border-t border-white/5">
                <Button type="submit" disabled={isSaving} className="rounded-xl px-8 h-11 font-bold gap-2 shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                </Button>
            </CardFooter>
        </form>
    );
}
