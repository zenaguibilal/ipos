
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
}

export function AddCustomerForm({ isOpen, onOpenChange, userId }: AddCustomerFormProps) {
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
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        const settlementDayNumber = settlementDay ? parseInt(settlementDay, 10) : undefined;
        if (settlementDay) {
            if (isNaN(settlementDayNumber!) || settlementDayNumber! < 1 || settlementDayNumber! > 31) {
                setError("Le jour de règlement doit être un nombre entre 1 et 31.");
                return;
            }
        }

        setIsLoading(true);
        const customersCollectionRef = collection(firestore, 'users', userId, 'customers');
        
        addDocumentNonBlocking(customersCollectionRef, {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            settlementDay: settlementDayNumber,
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
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouveau client</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations ci-dessous.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="first-name" className="text-right">
                                Prénom
                            </Label>
                            <Input
                                id="first-name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="last-name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="last-name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Téléphone
                            </Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settlementDay" className="text-right">
                                Jour de règlement
                            </Label>
                            <Input
                                id="settlementDay"
                                type="number"
                                value={settlementDay}
                                onChange={(e) => setSettlementDay(e.target.value)}
                                className="col-span-3"
                                min="1"
                                max="31"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Ajout...' : 'Ajouter le client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

    