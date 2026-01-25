
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, quantity: number, isRecurring: boolean) => Promise<void>;
}

export function AddOrderForm({ isOpen, onOpenChange, onConfirm }: AddOrderFormProps) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setQuantity('1');
        setIsRecurring(false);
    };

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
            await onConfirm(name, quantityNumber, isRecurring);
            onOpenChange(false);
        } catch (error) {
            // Error toast is shown by the parent page
        } finally {
            setIsLoading(false);
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
                        <DialogTitle>Ajouter une commande de pain</DialogTitle>
                        <DialogDescription>
                           Remplissez les informations pour ajouter une commande.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order-name" className="text-right">Nom</Label>
                            <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isLoading} autoFocus/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="order-quantity" className="text-right">Quantité</Label>
                            <Input id="order-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required disabled={isLoading} />
                        </div>
                        <div className="flex items-center space-x-2 justify-center pt-2">
                            <Label htmlFor="is-recurring">Commande récurrente ?</Label>
                            <Switch
                                id="is-recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                                disabled={isLoading}
                            />
                            <p className='text-xs text-muted-foreground'>(Conserver pour demain)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isLoading ? 'Ajout...' : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
