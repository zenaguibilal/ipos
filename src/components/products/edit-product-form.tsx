
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/app/products/page';

interface EditProductFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    product: Product;
}

export function EditProductForm({ isOpen, onOpenChange, userId, product }: EditProductFormProps) {
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(String(product.price));
            setBarcode(product.barcode || '');
        }
    }, [product]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber <= 0) {
            setError("Veuillez entrer un prix valide.");
            return;
        }

        if (!firestore) {
            setError("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const productDocRef = doc(firestore, 'users', userId, 'products', product.id);
        
        updateDocumentNonBlocking(productDocRef, {
            name: name,
            price: priceNumber,
            barcode: barcode,
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
            <DialogContent className="sm:max-w-[425px]">
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
                                Prix (€)
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
                            <Label htmlFor="edit-barcode" className="text-right">
                                Code-barres
                            </Label>
                            <Input
                                id="edit-barcode"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="col-span-3"
                            />
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
