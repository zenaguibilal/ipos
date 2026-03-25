'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

export function CompanyProfileForm() {
    const { profile, isSettingsLoading: isLoading } = useAppStore(state => state);
    const { updateProfile } = useAppStore(state => state.actions);
    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        setError(null);

        const dataToSave: Partial<Omit<CompanyProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
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
        };

        try {
            await updateProfile(dataToSave);
            toast.success('Profil de l\'entreprise mis à jour avec succès.');
        } catch (err) {
            setError("Une erreur est survenue lors de la mise à jour du profil.");
            toast.error("Échec de la mise à jour du profil.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-6">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                 ) : (
                    <>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="companyName">Nom de l'entreprise</Label><Input id="companyName" value={formState.companyName || ''} onChange={handleInputChange} disabled={isSaving}/></div>
                            <div className="space-y-2"><Label htmlFor="address">Adresse</Label><Input id="address" value={formState.address || ''} onChange={handleInputChange} disabled={isSaving}/></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="city">Ville</Label><Input id="city" value={formState.city || ''} onChange={handleInputChange} disabled={isSaving}/></div>
                                <div className="space-y-2"><Label htmlFor="zipCode">Code Postal</Label><Input id="zipCode" value={formState.zipCode || ''} onChange={handleInputChange} disabled={isSaving}/></div>
                                <div className="space-y-2"><Label htmlFor="country">Pays</Label><Input id="country" value={formState.country || ''} onChange={handleInputChange} disabled={isSaving}/></div>
                            </div>
                        </div>
                        <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Informations de Contact</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving} /></div>
                                <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="website">Site Web</Label><Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving} placeholder="https://www.exemple.com" /></div>
                        </div>

                         <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Paramètres Spécifiques</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="goldPricePerGram">Prix de l'or par gramme (DA)</Label>
                                    <Input 
                                        id="goldPricePerGram" 
                                        type="number"
                                        step="0.01"
                                        value={formState.goldPricePerGram || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving} 
                                        placeholder="Ex: 12000" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prix_pain">Prix de vente du pain (DA)</Label>
                                    <Input 
                                        id="prix_pain" 
                                        type="number"
                                        step="0.1"
                                        value={formState.prix_pain || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving} 
                                        placeholder="Ex: 15" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Informations Légales</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="vatNumber">N° TVA / NIF</Label><Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving} /></div>
                                 <div className="space-y-2"><Label htmlFor="rcNumber">N° Registre Commerce (RC)</Label><Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving} /></div>
                            </div>
                        </div>
                    </>
                 )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isSaving ? 'Enregistrement...' : 'Enregistrer le profil'}
                </Button>
            </CardFooter>
        </form>
    );
}
