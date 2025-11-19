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
    const [price, setPrice] = useState('');
    const [barcode, setBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        const productsCollectionRef = collection(firestore, 'users', userId, 'products');
        
        addDocumentNonBlocking(productsCollectionRef, {
            name: name,
            price: priceNumber,
            barcode: barcode,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                setName('');
                setPrice('');
                setBarcode('');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de l'ajout du produit.");
                console.error(err);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
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
                            <Label htmlFor="name" className="text-right">
                                Nom
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Prix (€)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="col-span-3"
                                required
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="barcode" className="text-right">
                                Code-barres
                            </Label>
                            <Input
                                id="barcode"
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
                            {isLoading ? 'Ajout...' : 'Ajouter le produit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
