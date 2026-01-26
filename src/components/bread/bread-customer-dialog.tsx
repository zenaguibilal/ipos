
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { BreadCustomer } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';

interface BreadCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: BreadCustomer | null;
    userId: string;
}

const initialFormState = {
    name: '',
    defaultOrderQuantity: '0',
    isActive: true,
};

export function BreadCustomerDialog({ isOpen, onOpenChange, customer, userId }: BreadCustomerDialogProps) {
    const firestore = useFirestore();
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (customer && isOpen) {
            setFormState({
                name: customer.name,
                defaultOrderQuantity: String(customer.defaultOrderQuantity),
                isActive: customer.isActive,
            });
        } else {
            setFormState(initialFormState);
        }
    }, [customer, isOpen]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { name, defaultOrderQuantity, isActive } = formState;

        if (!name) {
            setError("Le nom est requis.");
            setIsLoading(false);
            return;
        }

        if (!firestore) {
            setError("Service de base de données non disponible.");
            setIsLoading(false);
            return;
        }
        
        const customerData = {
            name,
            defaultOrderQuantity: parseInt(defaultOrderQuantity, 10) || 0,
            isActive,
            createdAt: customer?.createdAt || serverTimestamp(),
        };

        try {
            if (customer) { // Editing
                const customerRef = doc(firestore, 'users', userId, 'breadCustomers', customer.id);
                await setDocumentNonBlocking(customerRef, customerData, { merge: true });
                toast.success(`Client ${name} mis à jour.`);
            } else { // Adding
                const customersCollectionRef = collection(firestore, 'users', userId, 'breadCustomers');
                await addDocumentNonBlocking(customersCollectionRef, customerData);
                toast.success(`Client ${name} ajouté.`);
            }
            onOpenChange(false);
        } catch (err) {
            setError("Une erreur est survenue.");
            toast.error("Échec de l'opération.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{customer ? 'Modifier le client' : 'Ajouter un client (Pain)'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du client</Label>
                            <Input id="name" value={formState.name} onChange={(e) => setFormState(s => ({...s, name: e.target.value}))} required autoFocus />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultOrderQuantity">Commande par défaut</Label>
                            <Input id="defaultOrderQuantity" type="number" min="0" value={formState.defaultOrderQuantity} onChange={(e) => setFormState(s => ({...s, defaultOrderQuantity: e.target.value}))} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive">Client Actif</Label>
                                <DialogDescription>
                                    Les clients inactifs n'apparaîtront pas dans les nouvelles commandes.
                                </DialogDescription>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formState.isActive}
                                onCheckedChange={(checked) => setFormState(s => ({ ...s, isActive: checked }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
