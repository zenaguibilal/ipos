
'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';

interface AddPaymentFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    customer: Customer;
}

export function AddPaymentForm({ isOpen, onOpenChange, userId, customer }: AddPaymentFormProps) {
    const firestore = useFirestore();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setAmount('');
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            setError("Veuillez entrer un montant valide.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const paymentsCollectionRef = collection(firestore, 'users', userId, 'payments');
        
        addDocumentNonBlocking(paymentsCollectionRef, {
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            amount: amountNumber,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                resetForm();
                toast.success('Paiement enregistré avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de l'enregistrement du paiement.");
                toast.error("Échec de l'enregistrement du paiement.");
                console.error(err);
            }
        });
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
                        <DialogTitle>Encaisser un paiement</DialogTitle>
                        <DialogDescription>
                            Enregistrez un paiement pour {customer.firstName} {customer.lastName}. Ce montant sera déduit de son solde.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="payment-amount" className="text-right">Montant (DA)</Label>
                            <Input 
                                id="payment-amount" 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="col-span-3"
                                required 
                                step="0.01"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Enregistrement...' : 'Enregistrer le paiement'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
