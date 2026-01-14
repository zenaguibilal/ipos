'use client';

import { useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '@/components/profile/change-password-dialog';
import type { User } from 'firebase/auth';

interface UserProfile {
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
}

interface PersonalProfileFormProps {
    user: User;
}

export function PersonalProfileForm({ user }: PersonalProfileFormProps) {
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    
    useEffect(() => {
        if (userProfile) {
            setFirstName(userProfile.firstName || '');
            setLastName(userProfile.lastName || '');
            setPhone(userProfile.phone || '');
        }
    }, [userProfile]);

    const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userDocRef) return;
        
        setIsSaving(true);
        setError(null);
        
        updateDocumentNonBlocking(userDocRef, {
            firstName: firstName,
            lastName: lastName,
            phone: phone
        }, {
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Profil mis à jour avec succès.');
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

    const isEmailProvider = user.providerData.some(
        (provider) => provider.providerId === 'password'
    );

    return (
        <>
            {isEmailProvider && (
                <ChangePasswordDialog 
                    isOpen={isPasswordDialogOpen}
                    onOpenChange={setIsPasswordDialogOpen}
                />
            )}
            <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                     {isLoading ? (
                         <p>Chargement du profil...</p>
                     ) : (
                        <>
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" value={user.email || ''} disabled />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <Input 
                                        id="firstName" 
                                        value={firstName} 
                                        onChange={(e) => setFirstName(e.target.value)} 
                                        disabled={isSaving}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom de famille</Label>
                                    <Input 
                                        id="lastName" 
                                        value={lastName} 
                                        onChange={(e) => setLastName(e.target.value)} 
                                        disabled={isSaving}
                                        required
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input 
                                    id="phone" 
                                    type="tel"
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    disabled={isSaving}
                                />
                            </div>
                             {isEmailProvider && (
                                <div className="pt-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => setIsPasswordDialogOpen(true)}>
                                        Changer le mot de passe
                                    </Button>
                                </div>
                             )}
                        </>
                     )}
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoading}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                </CardFooter>
            </form>
        </>
    );
}

    