
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { BreadOrder } from '@/app/(app)/bread-orders/page';
import { toast } from 'sonner';

interface EditOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    order: BreadOrder;
}

export function EditOrderForm({ isOpen, onOpenChange, userId, order }: EditOrderFormProps) {
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (order) {
            setName(order.name);
            setQuantity(String(order.quantity));
            setIsRecurring(order.isRecurring || false);
        }
    }, [order]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        const quantityNumber = parseInt(quantity, 10);

        if (isNaN(quantityNumber) || quantityNumber <= 0) {
             setError("Veuillez entrer une quantité valide.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const orderDocRef = doc(firestore, 'users', userId, 'breadOrders', order.id);
        
        updateDocumentNonBlocking(orderDocRef, {
            name: name,
            quantity: quantityNumber,
            isRecurring: isRecurring,
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                toast.success('Commande mise à jour avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de la mise à jour de la commande.");
                toast.error("Échec de la mise à jour de la commande.");
                console.error(err);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Modifier la commande de pain</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations ci-dessous.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="edit-order-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-quantity" className="text-right">
                                Quantité
                            </Label>
                            <Input
                                id="edit-order-quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2 justify-center col-span-4 pt-2">
                           <Checkbox 
                                id="edit-is-recurring"
                                checked={isRecurring}
                                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                            />
                            <Label
                                htmlFor="edit-is-recurring"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Commande récurrente (quotidienne)
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
