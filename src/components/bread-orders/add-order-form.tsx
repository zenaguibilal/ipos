'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AddOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, quantity: number, isRecurring: boolean) => void;
}

export function AddOrderForm({ isOpen, onOpenChange, onConfirm }: AddOrderFormProps) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);

    const resetForm = () => {
        setName('');
        setQuantity('1');
        setIsRecurring(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

        onConfirm(name, quantityNumber, isRecurring);
        resetForm();
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
                        <DialogTitle>Ajouter une commande de pain</DialogTitle>
                        <DialogDescription>
                           Remplissez les informations pour ajouter une commande.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order-name" className="text-right">Nom</Label>
                            <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order-quantity" className="text-right">Quantité</Label>
                            <Input id="order-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="flex items-center space-x-2 justify-center pt-2">
                            <Label htmlFor="is-recurring">Commande récurrente ?</Label>
                            <Switch
                                id="is-recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                            />
                            <p className='text-xs text-muted-foreground'>(Conserver pour demain)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit">
                           Ajouter
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
