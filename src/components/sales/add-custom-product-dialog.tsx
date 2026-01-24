'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddCustomProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, price: number) => void;
}

export function AddCustomProductDialog({ isOpen, onOpenChange, onConfirm }: AddCustomProductDialogProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const resetForm = () => {
        setName('');
        setPrice('');
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const priceNumber = parseFloat(price);

        if (!name.trim()) {
            toast.error("Veuillez entrer un nom pour l'article.");
            return;
        }

        if (isNaN(priceNumber) || priceNumber < 0) {
            toast.error("Veuillez entrer un prix valide.");
            return;
        }

        onConfirm(name.trim(), priceNumber);
        onOpenChange(false);
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
                        <DialogTitle>Ajouter un article personnalisé</DialogTitle>
                        <DialogDescription>
                           Entrez le nom et le prix de l'article à ajouter au panier. Cet article ne sera pas enregistré dans votre inventaire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-name" className="text-right">Nom</Label>
                            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required autoFocus />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-price" className="text-right">Prix (DA)</Label>
                            <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required step="0.1" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit">
                           Ajouter au panier
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
