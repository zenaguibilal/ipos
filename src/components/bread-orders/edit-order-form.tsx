
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { BreadOrder } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EditOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (id: string, name: string, quantity: number, isRecurring: boolean) => Promise<void>;
    order: BreadOrder;
}

export function EditOrderForm({ isOpen, onOpenChange, onConfirm, order }: EditOrderFormProps) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (order) {
            setName(order.name);
            setQuantity(String(order.quantity));
            setIsRecurring(order.isRecurring);
        }
    }, [order]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const quantityNumber = parseInt(quantity, 10);

        if (!name.trim()) {
            toast.error("Veuillez entrer un nom.");
            return;
        }

        if (isNaN(quantityNumber) || quantityNumber <= 0) {
            toast.error("Veuillez entrer une quantité valide.");
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm(order.id, name, quantityNumber, isRecurring);
            onOpenChange(false);
        } catch (error) {
            // Parent page shows toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Modifier la commande</DialogTitle>
                        <DialogDescription>
                           Mettez à jour les informations de la commande.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-name" className="text-right">Nom</Label>
                            <Input id="edit-order-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isLoading} autoFocus/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-quantity" className="text-right">Quantité</Label>
                            <Input id="edit-order-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required disabled={isLoading} />
                        </div>
                        <div className="flex items-center space-x-2 justify-center pt-2">
                            <Label htmlFor="edit-is-recurring">Commande récurrente ?</Label>
                            <Switch
                                id="edit-is-recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                                disabled={isLoading}
                            />
                            <p className='text-xs text-muted-foreground'>(Conserver pour demain)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
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
