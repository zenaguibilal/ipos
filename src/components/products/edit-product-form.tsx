'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/lib/types';

interface EditProductFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    product: Product & { barcode?: string }; // Allow old barcode property
}

export function EditProductForm({ isOpen, onOpenChange, userId, product }: EditProductFormProps) {
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minStockLevel, setMinStockLevel] = useState('');
    const [barcodes, setBarcodes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(String(product.price));
            setPurchasePrice(String(product.purchasePrice));
            setQuantity(String(product.quantity));
            setMinStockLevel(String(product.minStockLevel));
            // Handle both new 'barcodes' array and old 'barcode' string for backward compatibility
            const existingBarcodes = product.barcodes?.join(', ') || product.barcode || '';
            setBarcodes(existingBarcodes);
        }
    }, [product]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        const priceNumber = parseFloat(price);
        const purchasePriceNumber = parseFloat(purchasePrice);
        const quantityNumber = parseFloat(quantity);
        const minStockLevelNumber = parseInt(minStockLevel, 10);

        if (isNaN(priceNumber) || priceNumber <= 0) {
            setError("Veuillez entrer un prix de vente valide.");
            return;
        }
        if (isNaN(purchasePriceNumber) || purchasePriceNumber < 0) {
            setError("Veuillez entrer un prix d'achat valide.");
            return;
        }
        if (isNaN(quantityNumber) || quantityNumber < 0) {
             setError("Veuillez entrer une quantité valide.");
            return;
        }
        if (isNaN(minStockLevelNumber) || minStockLevelNumber < 0) {
             setError("Veuillez entrer un niveau de stock minimum valide.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const productDocRef = doc(firestore, 'users', userId, 'products', product.id);
        
        const barcodesArray = barcodes.split(',').map(b => b.trim()).filter(b => b);

        updateDocumentNonBlocking(productDocRef, {
            name: name,
            price: priceNumber,
            purchasePrice: purchasePriceNumber,
            quantity: quantityNumber,
            minStockLevel: minStockLevelNumber,
            barcodes: barcodesArray,
            barcode: null // Explicitly remove old field during migration
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de la mise à jour du produit.");
                console.error(err);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Modifier le produit</DialogTitle>
                        <DialogDescription>
                            Mettez à jour les informations ci-dessous.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">
                                Prix Vente (DA)
                            </Label>
                            <Input
                                id="edit-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-purchase-price" className="text-right">
                                Prix Achat (DA)
                            </Label>
                            <Input
                                id="edit-purchase-price"
                                type="number"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.01"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-quantity" className="text-right">
                                Quantité
                            </Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="col-span-3"
                                required
                                step="any"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-min-stock" className="text-right">
                                Stock Min.
                            </Label>
                            <Input
                                id="edit-min-stock"
                                type="number"
                                value={minStockLevel}
                                onChange={(e) => setMinStockLevel(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-barcodes" className="text-right pt-2">
                                Codes-barres
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="edit-barcodes"
                                    value={barcodes}
                                    onChange={(e) => setBarcodes(e.target.value)}
                                    placeholder="ex: 123, 456, 789"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Séparez plusieurs codes-barres par une virgule.</p>
                            </div>
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
    
