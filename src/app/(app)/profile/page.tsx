
'use client';

import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // This fetches the user's profile data from Firestore
    const userDocRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    // When the user data loads, populate the form
    useEffect(() => {
        if (user && user.displayName) {
            const nameParts = user.displayName.split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
        }
    }, [user]);

    // Handle form submission
    const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userDocRef) return;
        
        setIsLoading(true);
        setError(null);
        
        updateDocumentNonBlocking(userDocRef, {
            firstName: firstName,
            lastName: lastName,
        }, {
            onSuccess: () => {
                setIsLoading(false);
                toast.success('Profil mis à jour avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de la mise à jour du profil.");
                console.error(err);
                toast.error("Échec de la mise à jour du profil.");
            }
        });
    };

    if (isUserLoading || !user) {
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
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nom de famille</Label>
                            <Input 
                                id="lastName" 
                                value={lastName} 
                                onChange={(e) => setLastName(e.target.value)} 
                                disabled={isLoading}
                                required
                            />
                        </div>
                         <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </main>
    );
}
