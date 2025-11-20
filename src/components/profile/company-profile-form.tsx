
'use client';

import { useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { User } from 'firebase/auth';

interface CompanyProfile {
    companyName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    vatNumber?: string;
}

interface CompanyProfileFormProps {
    user: User;
}

export function CompanyProfileForm({ user }: CompanyProfileFormProps) {
    const firestore = useFirestore();

    const companyDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // Use a fixed ID 'main' for the singleton document
        return doc(firestore, 'users', user.uid, 'companyProfile', 'main');
    }, [user, firestore]);
    
    const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(companyDocRef);

    const [formState, setFormState] = useState<CompanyProfile>({});
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
        
        setDocumentNonBlocking(companyDocRef, {
            ...formState,
            updatedAt: serverTimestamp()
        }, { merge: true }, {
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
        <Card>
            <form onSubmit={handleUpdateProfile}>
                <CardHeader>
                    <CardTitle>Profil de l'Entreprise</CardTitle>
                    <CardDescription>
                        Gérez les informations de votre entreprise pour la facturation et les documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading ? (
                         <p>Chargement des informations...</p>
                     ) : (
                        <>
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
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
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone (Entreprise)</Label>
                                    <Input 
                                        id="phone" 
                                        type="tel"
                                        value={formState.phone || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vatNumber">N° TVA</Label>
                                    <Input 
                                        id="vatNumber" 
                                        value={formState.vatNumber || ''} 
                                        onChange={handleInputChange} 
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </>
                     )}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button type="submit" className="w-full" disabled={isSaving || isLoading}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer le profil de l\'entreprise'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
