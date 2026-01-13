
'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddCustomerFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    onCustomerAdded?: (id: string) => void;
}

export function AddCustomerForm({ isOpen, onOpenChange, userId, onCustomerAdded }: AddCustomerFormProps) {
    const firestore = useFirestore();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [settlementDay, setSettlementDay] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setSettlementDay('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const settlementDayNumber = parseInt(settlementDay);
        if (settlementDay && (isNaN(settlementDayNumber) || settlementDayNumber < 1 || settlementDayNumber > 31)) {
            setError("Le jour de règlement doit être un nombre entre 1 et 31.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const customersCollectionRef = collection(firestore, 'users', userId, 'customers');
        
        const promise = addDocumentNonBlocking(customersCollectionRef, {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            settlementDay: settlementDayNumber || null,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                resetForm();
                toast.success('Client ajouté avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de l'ajout du client.");
                toast.error("Échec de l'ajout du client.");
                console.error(err);
            }
        });

        const newDocRef = await promise;
        if (newDocRef && onCustomerAdded) {
            onCustomerAdded(newDocRef.id);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouveau client</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations pour ajouter un client.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-firstName" className="text-right">Prénom</Label>
                            <Input id="add-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-lastName" className="text-right">Nom</Label>
                            <Input id="add-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-phone" className="text-right">Téléphone</Label>
                            <Input id="add-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="Ex: 213..."/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-settlementDay" className="text-right">Jour de règlement</Label>
                            <Input id="add-settlementDay" type="number" value={settlementDay} onChange={(e) => setSettlementDay(e.target.value)} className="col-span-3" placeholder="Ex: 5 (le 5 de chaque mois)"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Ajout...' : 'Ajouter le client'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

    