
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, isLoading: isDataLoading } = useDoc<{
    firstName: string;
    lastName: string;
    email: string;
  }>(userDocRef);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
    }
  }, [userData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userDocRef) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    updateDocumentNonBlocking(userDocRef, {
      firstName: firstName,
      lastName: lastName,
      updatedAt: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setIsSaving(false);
        setMessage('Votre profil a été mis à jour avec succès !');
      },
      onError: (err) => {
        setIsSaving(false);
        setError("Une erreur est survenue lors de la mise à jour.");
        // The global error handler will also catch and display this.
        console.error(err);
      }
    });
  };

  const isLoading = isUserLoading || isDataLoading;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement du profil...</p>
      </div>
    );
  }

  // This might happen briefly if the user document hasn't been created yet
  if (!userData) {
      return (
        <div className="flex h-full items-center justify-center">
          <p>Chargement des données utilisateur...</p>
        </div>
      );
  }


  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Votre Profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && <p className="text-sm text-green-500 text-center">{message}</p>}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="first-name">Prénom</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Nom de famille</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={userData.email} disabled />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
