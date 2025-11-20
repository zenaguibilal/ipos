
'use client';

import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UserProfile {
    firstName: string;
    lastName: string;
    phone?: string;
    email: string;
}

export default function ProfilePage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

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
    
    // When the user data loads from firestore, populate the form
    useEffect(() => {
        if (userProfile) {
            setFirstName(userProfile.firstName || '');
            setLastName(userProfile.lastName || '');
            setPhone(userProfile.phone || '');
        }
    }, [userProfile]);

    // Handle form submission
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
    
    const isLoading = isAuthLoading || isProfileLoading;

    if (isLoading || !user) {
        return (
            <div className="flex h-full items-center justify-center">
                <p>Chargement du profil...</p>
            </div>
        );
    }
    
    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Profil</CardTitle>
                    <CardDescription>
                        Gérez les informations de votre compte.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                    <CardContent className="space-y-4">
                         {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" type="email" value={user.email || ''} disabled />
                        </div>
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
                         <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </main>
    );
}
