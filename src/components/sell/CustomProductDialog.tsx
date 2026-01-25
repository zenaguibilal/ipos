
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (name: string, price: number) => void;
}

export function CustomProductDialog({ isOpen, onOpenChange, onConfirm }: CustomProductDialogProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const handleConfirm = () => {
        const priceNum = parseFloat(price);
        if (name.trim() && !isNaN(priceNum) && priceNum >= 0) {
            onConfirm(name.trim(), priceNum);
            setName('');
            setPrice('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un Produit Personnalisé</DialogTitle>
                    <DialogDescription>Ajoutez un article qui n'est pas dans votre inventaire.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="custom-product-name">Nom du produit</Label>
                        <Input 
                            id="custom-product-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="custom-product-price">Prix de vente (DA)</Label>
                        <Input 
                            id="custom-product-price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleConfirm}>Ajouter au panier</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
