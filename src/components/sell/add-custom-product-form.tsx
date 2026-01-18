
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddCustomProductFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, price: number) => void;
}

export function AddCustomProductForm({ isOpen, onOpenChange, onConfirm }: AddCustomProductFormProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setName('');
        setPrice('');
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        const priceNumber = parseFloat(price);

        if (!name.trim()) {
            setError("Veuillez entrer un nom pour le produit.");
            return;
        }

        if (isNaN(priceNumber) || priceNumber <= 0) {
            setError("Veuillez entrer un prix de vente valide.");
            return;
        }

        onConfirm(name, priceNumber);
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
                        <DialogTitle>Ajouter un produit personnalisé</DialogTitle>
                        <DialogDescription>
                            Créez un article temporaire pour cette vente uniquement. Il ne sera pas sauvegardé dans l'inventaire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="custom-product-name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="custom-product-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="custom-product-price" className="text-right">
                                Prix Vente (DA)
                            </Label>
                            <Input
                                id="custom-product-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.1"
                            />
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
