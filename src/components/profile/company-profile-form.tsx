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
    Loader2, Save, Globe, Phone, Mail, MapPin, 
    ShoppingBag, Coins, Wheat, Star, DollarSign, Binary, Calendar
} from 'lucide-react';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { Separator } from '../ui/separator';
import { DatePicker } from '../ui/date-picker';

interface CompanyProfileFormProps {
    mode: 'company' | 'settings';
}

export function CompanyProfileForm({ mode }: CompanyProfileFormProps) {
    const { profile, isSettingsLoading } = useAppStore(state => ({
        profile: state.profile,
        isSettingsLoading: state.isSettingsLoading,
    }));
    const { updateProfile } = useAppStore(state => state.actions);
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

    const handleDateChange = (date?: Date) => {
        setFormState(prev => ({ ...prev, zakatAnniversary: date?.toISOString() }));
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
                currencySymbol: formState.currencySymbol || undefined,
                decimalPlaces: formState.decimalPlaces !== undefined ? Number(formState.decimalPlaces) : undefined,
                zakatAnniversary: formState.zakatAnniversary || undefined,
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
                        <Skeleton className="h-14 w-full rounded-2xl" />
                    </div>
                ))}
            </CardContent>
        );
    }

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-12 pt-10">
                {mode === 'company' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Identité Fondamentale</h4>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom de l'enseigne commerciale</Label>
                                    <div className="relative group">
                                        <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                        <Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-lg" placeholder="Ex: Boutique iPOS" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Siège Social & Adresse</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                        <Input id="address" value={formState.address || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Ville</Label>
                                        <Input id="city" value={formState.city || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">CP</Label>
                                        <Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-mono font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-blue-400" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Canaux & Registres Légaux</h4>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Contact Tél</Label>
                                        <Input id="phone" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-blue-400/40 font-mono font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Pro</Label>
                                        <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-blue-400/40 font-bold" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vatNumber" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Identifiant Fiscal (NIF)</Label>
                                        <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-blue-400/40 font-mono font-bold uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rcNumber" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">N° Registre Commerce</Label>
                                        <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-blue-400/40 font-mono font-bold uppercase" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Site Officiel / Catalogue</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400/30 group-focus-within:text-blue-400 transition-colors" />
                                        <Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-blue-400/40 font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:rotate-12 transition-all duration-700">
                                    <Wheat className="h-48 w-48 text-primary" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/20 rounded-2xl shadow-inner"><Wheat className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Boulangerie</h4>
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Prix unitaire Pain (DA)</p>
                                        </div>
                                    </div>
                                    <Input id="prix_pain" type="number" step="0.1" value={formState.prix_pain || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-20 text-5xl font-black rounded-[2rem] bg-background/60 border-primary/20 focus:border-primary text-center tracking-tighter" />
                                </div>
                            </div>

                            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-orange-500/10 via-transparent to-transparent border border-orange-500/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:-rotate-12 transition-all duration-700">
                                    <Coins className="h-48 w-48 text-orange-400" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-500/20 rounded-2xl shadow-inner"><Coins className="h-6 w-6 text-orange-400" /></div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Marché Or</h4>
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Prix Gramme 24k (DA)</p>
                                        </div>
                                    </div>
                                    <Input id="goldPricePerGram" type="number" step="0.01" value={formState.goldPricePerGram || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-20 text-5xl font-black rounded-[2rem] bg-background/60 border-orange-500/20 focus:border-orange-500 text-center tracking-tighter" />
                                </div>
                            </div>

                            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border border-blue-500/10 relative overflow-hidden group shadow-2xl">
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:rotate-6 transition-all duration-700">
                                    <Calendar className="h-48 w-48 text-blue-400" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-500/20 rounded-2xl shadow-inner"><Calendar className="h-6 w-6 text-blue-400" /></div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">حول الحول</h4>
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">تاريخ استحقاق الزكاة</p>
                                        </div>
                                    </div>
                                    <div className="h-20 flex items-center justify-center bg-background/60 rounded-[2rem] border border-blue-500/20">
                                        <DatePicker date={formState.zakatAnniversary ? new Date(formState.zakatAnniversary) : undefined} setDate={handleDateChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-chart-quaternary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-chart-quaternary" /></div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-chart-quaternary">Finances & Région</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="currencySymbol" className="text-[10px] font-black uppercase opacity-60 ml-1">Symbole monnaie</Label>
                                        <Input id="currencySymbol" value={formState.currencySymbol || ''} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-chart-quaternary/40 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="decimalPlaces" className="text-[10px] font-black uppercase opacity-60 ml-1">Décimales</Label>
                                        <Input id="decimalPlaces" type="number" min="0" max="3" value={formState.decimalPlaces ?? 1} onChange={handleInputChange} disabled={isSaving || !isManagerOrAdmin} className="h-14 rounded-2xl bg-background/40 border-white/5 focus:border-chart-quaternary/40 font-bold" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 rounded-[3rem] bg-muted/10 border border-white/5 flex flex-col justify-center text-center">
                                <div className="p-4 bg-chart-quaternary/5 rounded-2xl border border-chart-quaternary/10 mb-4">
                                    <p className="text-[10px] font-black uppercase text-chart-quaternary mb-2">Simulation</p>
                                    <p className="text-4xl font-black tracking-tighter">1250.50 {formState.currencySymbol || 'DA'}</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Paramètres globaux pour rapports et factures.</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-white/5 p-8 border-t border-white/5 mt-12 flex flex-col sm:flex-row items-center justify-end gap-6 rounded-b-[2.5rem]">
                {isManagerOrAdmin && (
                    <Button type="submit" disabled={isSaving} className="h-14 px-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto bg-primary hover:bg-primary/90">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Graver les Décrets
                    </Button>
                )}
            </CardFooter>
        </form>
    );
}
