
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer } from '@/lib/types';
import { toast } from 'sonner';

interface EditCustomerFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    customer: Customer;
}

export function EditCustomerForm({ isOpen, onOpenChange, userId, customer }: EditCustomerFormProps) {
    const firestore = useFirestore();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [settlementDay, setSettlementDay] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFirstName(customer.firstName);
            setLastName(customer.lastName);
            setPhone(customer.phone || '');
            setSettlementDay(customer.settlementDay?.toString() || '');
        }
    }, [customer]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
        const docRef = doc(firestore, 'users', userId, 'customers', customer.id);
        
        updateDocumentNonBlocking(docRef, {
            firstName,
            lastName,
            phone,
            settlementDay: settlementDayNumber || null,
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                toast.success('Client mis à jour avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de la mise à jour.");
                toast.error("Échec de la mise à jour du client.");
                console.error(err);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Modifier le client</DialogTitle>
                        <DialogDescription>Mettez à jour les informations ci-dessous.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-firstName" className="text-right">Prénom</Label>
                            <Input id="edit-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-lastName" className="text-right">Nom</Label>
                            <Input id="edit-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">Téléphone</Label>
                            <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-settlementDay" className="text-right">Jour de règlement</Label>
                            <Input id="edit-settlementDay" type="number" value={settlementDay} onChange={(e) => setSettlementDay(e.target.value)} className="col-span-3" placeholder="Ex: 5 (le 5 de chaque mois)"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

    