
'use client';

import { useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { CompanyProfile } from '@/lib/types';
import type { User } from 'firebase/auth';

interface CompanyProfileFormProps {
    user: User;
}

export function CompanyProfileForm({ user }: CompanyProfileFormProps) {
    const firestore = useFirestore();

    const companyDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid, 'companyProfile', 'main');
    }, [user, firestore]);
    
    const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(companyDocRef);

    const [formState, setFormState] = useState<Partial<CompanyProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (companyProfile) {
            setFormState(companyProfile);
        }
    }, [companyProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!companyDocRef) return;
        
        setIsSaving(true);
        setError(null);

        const dataToSave = {
            ...formState,
            breadPrice: formState.breadPrice ? Number(formState.breadPrice) : undefined,
            breadPurchasePrice: formState.breadPurchasePrice ? Number(formState.breadPurchasePrice) : undefined,
            updatedAt: serverTimestamp()
        };

        setDocumentNonBlocking(companyDocRef, dataToSave, { merge: true }, {
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Profil de l\'entreprise mis à jour avec succès.');
            },
            onError: (err) => {
                setIsSaving(false);
                setError("Une erreur est survenue lors de la mise à jour du profil.");
                console.error(err);
                toast.error("Échec de la mise à jour du profil.");
            }
        });
    };

    const isLoading = isProfileLoading;

    return (
        <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-6">
                 {isLoading ? (
                     <p>Chargement des informations...</p>
                 ) : (
                    <>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                                <Input 
                                    id="companyName" 
                                    value={formState.companyName || ''} 
                                    onChange={handleInputChange} 
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input 
                                    id="address" 
                                    value={formState.address || ''} 
                                    onChange={handleInputChange} 
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ville</Label>
                                    <Input 
                                        id="city" 
                                        value={formState.city || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Code Postal</Label>
                                    <Input 
                                        id="zipCode" 
                                        value={formState.zipCode || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input 
                                        id="country" 
                                        value={formState.country || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Informations de Contact</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input id="phone" type="tel" value={formState.phone || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" value={formState.email || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Site Web</Label>
                                <Input id="website" value={formState.website || ''} onChange={handleInputChange} disabled={isSaving} placeholder="https://www.exemple.com" />
                            </div>
                        </div>
                        
                        <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Paramètres Spécifiques</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="breadPrice">Prix de vente du pain (DA)</Label>
                                    <Input id="breadPrice" type="number" value={formState.breadPrice || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="breadPurchasePrice">Prix d'achat du pain (DA)</Label>
                                    <Input id="breadPurchasePrice" type="number" value={formState.breadPurchasePrice || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-6">
                            <h4 className="font-medium text-muted-foreground">Informations Légales</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vatNumber">N° TVA / NIF</Label>
                                    <Input id="vatNumber" value={formState.vatNumber || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="rcNumber">N° Registre Commerce (RC)</Label>
                                    <Input id="rcNumber" value={formState.rcNumber || ''} onChange={handleInputChange} disabled={isSaving} />
                                </div>
                            </div>
                        </div>
                    </>
                 )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer le profil de l\'entreprise'}
                </Button>
            </CardFooter>
        </form>
    );
}

    
