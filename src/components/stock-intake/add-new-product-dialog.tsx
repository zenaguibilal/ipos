
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { StockIntakeItem } from '@/lib/types';

interface AddNewProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    scannedCode: string;
    onConfirm: (item: StockIntakeItem) => void;
}

export function AddNewProductDialog({ isOpen, onOpenChange, scannedCode, onConfirm }: AddNewProductDialogProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [barcodes, setBarcodes] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setName('');
            setCategory('');
            setPrice('');
            setPurchasePrice('');
            setQuantity('1');
            setBarcodes(scannedCode && !scannedCode.includes('...') ? scannedCode : '');
        }
    }, [isOpen, scannedCode]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const priceNumber = parseFloat(price);
        const purchasePriceNumber = parseFloat(purchasePrice);
        const quantityNumber = parseInt(quantity, 10);

        if (!name.trim()) {
            toast.error("Veuillez entrer un nom de produit.");
            return;
        }
        if (isNaN(priceNumber) || priceNumber <= 0) {
            toast.error("Veuillez entrer un prix de vente valide.");
            return;
        }
         if (isNaN(purchasePriceNumber) || purchasePriceNumber < 0) {
            toast.error("Veuillez entrer un prix d'achat valide.");
            return;
        }

        const newItem: StockIntakeItem = {
            id: `new-${Date.now()}`,
            productId: undefined,
            name,
            category,
            barcodes: barcodes.split(',').map(b => b.trim()).filter(Boolean),
            quantity: quantityNumber,
            purchasePrice: purchasePriceNumber,
            price: priceNumber,
            isNew: true,
        };

        onConfirm(newItem);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                        <DialogDescription>
                            {scannedCode
                                ? `Le code "${scannedCode}" n'a été trouvé dans aucun produit. Ajoutez-le maintenant.`
                                : "Ajoutez un nouveau produit qui n'est pas encore dans votre inventaire."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="space-y-1">
                            <Label htmlFor="new-product-name">Nom du produit</Label>
                            <Input id="new-product-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="new-product-barcodes">Codes-barres</Label>
                            <Input id="new-product-barcodes" value={barcodes} onChange={(e) => setBarcodes(e.target.value)} />
                             <p className="text-xs text-muted-foreground">Séparez par une virgule.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <Label htmlFor="new-product-purchasePrice">Prix Achat</Label>
                                <Input id="new-product-purchasePrice" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required step="0.1" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="new-product-price">Prix Vente</Label>
                                <Input id="new-product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.1" />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <Label htmlFor="new-product-quantity">Quantité Reçue</Label>
                                <Input id="new-product-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="new-product-category">Catégorie</Label>
                                <Input id="new-product-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Boissons" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit">Ajouter à la réception</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
