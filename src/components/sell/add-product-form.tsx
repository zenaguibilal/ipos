
'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddProductFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
}

export function AddProductForm({ isOpen, onOpenChange, userId }: AddProductFormProps) {
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [price, setPrice] = useState(''); // selling price
    const [purchasePrice, setPurchasePrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minStockLevel, setMinStockLevel] = useState('');
    const [barcode, setBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setPrice('');
        setPurchasePrice('');
        setQuantity('');
        setMinStockLevel('');
        setBarcode('');
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        const priceNumber = parseFloat(price);
        const purchasePriceNumber = parseFloat(purchasePrice);
        const quantityNumber = parseInt(quantity, 10);
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
        const productsCollectionRef = collection(firestore, 'users', userId, 'products');
        
        addDocumentNonBlocking(productsCollectionRef, {
            name: name,
            price: priceNumber, // selling price
            purchasePrice: purchasePriceNumber,
            quantity: quantityNumber,
            minStockLevel: minStockLevelNumber,
            barcode: barcode,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                resetForm();
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de l'ajout du produit.");
                console.error(err);
            }
        });
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
                        <DialogTitle>Ajouter un nouveau produit</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations ci-dessous pour ajouter un produit à votre inventaire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="sell-add-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-price" className="text-right">
                                Prix Vente (€)
                            </Label>
                            <Input
                                id="sell-add-price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.01"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-purchasePrice" className="text-right">
                                Prix Achat (€)
                            </Label>
                            <Input
                                id="sell-add-purchasePrice"
                                type="number"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-quantity" className="text-right">
                                Quantité
                            </Label>
                            <Input
                                id="sell-add-quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-minStockLevel" className="text-right">
                                Stock Min.
                            </Label>
                            <Input
                                id="sell-add-minStockLevel"
                                type="number"
                                value={minStockLevel}
                                onChange={(e) => setMinStockLevel(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sell-add-barcode" className="text-right">
                                Code-barres
                            </Label>
                            <Input
                                id="sell-add-barcode"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Ajout...' : 'Ajouter le produit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
