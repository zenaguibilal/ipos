
'use client';

import { useState } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddProductFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
}

export function AddProductForm({ isOpen, onOpenChange, userId }: AddProductFormProps) {
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minStockLevel, setMinStockLevel] = useState('');
    const [barcodes, setBarcodes] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setCategory('');
        setPrice('');
        setPurchasePrice('');
        setQuantity('');
        setMinStockLevel('');
        setBarcodes('');
        setImageUrl('');
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
        
        const barcodesArray = barcodes.split(',').map(b => b.trim()).filter(b => b);

        addDocumentNonBlocking(productsCollectionRef, {
            name: name,
            category: category,
            price: priceNumber,
            purchasePrice: purchasePriceNumber,
            quantity: quantityNumber,
            minStockLevel: minStockLevelNumber,
            barcodes: barcodesArray,
            imageUrl: imageUrl,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setIsLoading(false);
                onOpenChange(false);
                resetForm();
                toast.success('Produit ajouté avec succès.');
            },
            onError: (err) => {
                setIsLoading(false);
                setError("Une erreur est survenue lors de l'ajout du produit.");
                toast.error("Échec de l'ajout du produit.");
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
                            Remplissez les informations pour ajouter un produit à l'inventaire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-name" className="text-right">Nom</Label>
                            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-category" className="text-right">Catégorie</Label>
                            <Input id="add-category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" placeholder="Ex: Boissons" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-purchasePrice" className="text-right">Prix Achat</Label>
                            <Input id="add-purchasePrice" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="col-span-3" required step="0.1" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-price" className="text-right">Prix Vente</Label>
                            <Input id="add-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required step="0.1" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-quantity" className="text-right">Quantité</Label>
                            <Input id="add-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-minStockLevel" className="text-right">Stock Min.</Label>
                            <Input id="add-minStockLevel" type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="add-barcodes" className="text-right pt-2">Codes-barres</Label>
                            <div className="col-span-3">
                                <Input id="add-barcodes" value={barcodes} onChange={(e) => setBarcodes(e.target.value)} placeholder="ex: 123, 456" />
                                <p className="text-xs text-muted-foreground mt-1">Séparez par une virgule.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="add-imageUrl" className="text-right">URL de l'image</Label>
                            <Input id="add-imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="https://example.com/image.png"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Ajout...' : 'Ajouter le produit'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
