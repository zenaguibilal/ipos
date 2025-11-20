
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CompanyProfile {
    companyName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    vatNumber?: string;
}

export default function CompanySettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const companyDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'companyProfile', 'main');
  }, [user, firestore]);

  const { data: companyData, isLoading: isDataLoading } = useDoc<CompanyProfile>(companyDocRef);

  const [formData, setFormData] = useState<CompanyProfile>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (companyData) {
      setFormData(companyData);
    }
  }, [companyData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyDocRef) return;

    setIsSaving(true);
    const dataToSave = {
      ...formData,
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(companyDocRef, dataToSave, { merge: true }, {
      onSuccess: () => {
        setIsSaving(false);
        toast.success('Les informations de l\'entreprise ont été mises à jour.');
      },
      onError: (err) => {
        setIsSaving(false);
        toast.error("Échec de la mise à jour des informations.");
        console.error(err);
      }
    });
  };

  const isLoading = isUserLoading || isDataLoading;

  return (
    <Card className="border-none shadow-none">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Informations sur l'entreprise</CardTitle>
          <CardDescription>
            Ces informations seront utilisées pour la facturation et les documents officiels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <>
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleChange} disabled={isSaving} />
              </div>
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="vatNumber">Numéro de TVA</Label>
                <Input id="vatNumber" name="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} disabled={isSaving} />
              </div>
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} disabled={isSaving} />
              </div>
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} disabled={isSaving} />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="grid gap-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" name="city" value={formData.city || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zipCode">Code Postal</Label>
                  <Input id="zipCode" name="zipCode" value={formData.zipCode || ''} onChange={handleChange} disabled={isSaving} />
                </div>
              </div>
               <div className="grid gap-2 max-w-sm">
                <Label htmlFor="country">Pays</Label>
                <Input id="country" name="country" value={formData.country || ''} onChange={handleChange} disabled={isSaving} />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-start">
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
