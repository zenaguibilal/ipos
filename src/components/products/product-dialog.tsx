'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { Loader2, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { dataService } from '@/services/data-service';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
}

const initialFormState = {
    name: '',
    category: '',
    price: '',
    purchasePrice: '',
    quantity: '',
    minStockLevel: '',
    barcodes: [] as string[],
    imageUrl: '',
};

export function ProductDialog({ isOpen, onOpenChange, product }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            setFormState({
                name: product.name,
                category: product.category || '',
                price: String(product.price),
                purchasePrice: String(product.purchasePrice),
                quantity: String(product.quantity),
                minStockLevel: String(product.minStockLevel),
                barcodes: product.barcodes || [],
                imageUrl: product.imageUrl || '',
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
    }, [product, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleAddBarcode = () => {
        if (currentBarcode.trim() && !formState.barcodes.includes(currentBarcode.trim())) {
            setFormState(prev => ({ ...prev, barcodes: [...prev.barcodes, currentBarcode.trim()] }));
            setCurrentBarcode('');
        }
    };
    
    const handleRemoveBarcode = (barcodeToRemove: string) => {
        setFormState(prev => ({...prev, barcodes: prev.barcodes.filter(b => b !== barcodeToRemove)}));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { name, category, price, purchasePrice, quantity, minStockLevel, barcodes, imageUrl } = formState;

        if (!name) {
            setError("Le nom du produit est requis.");
            setIsLoading(false);
            return;
        }

        const priceNum = parseFloat(price);
        const purchasePriceNum = parseFloat(purchasePrice);
        const quantityNum = parseInt(quantity, 10);
        const minStockNum = parseInt(minStockLevel, 10);

        if (isNaN(priceNum) || isNaN(purchasePriceNum) || isNaN(quantityNum) || isNaN(minStockNum)) {
            setError("Veuillez entrer des valeurs numériques valides pour les prix et les quantités.");
            setIsLoading(false);
            return;
        }
        
        const productData = {
            name,
            category,
            price: priceNum,
            purchasePrice: purchasePriceNum,
            quantity: quantityNum,
            minStockLevel: minStockNum,
            barcodes,
            imageUrl,
        };

        try {
            if (product && product.id) {
                await dataService.updateProduct(product.id as number, productData);
                toast.success(`Produit ${name} mis à jour.`);
            } else {
                await dataService.addProduct(productData);
                toast.success(`Produit ${name} ajouté.`);
            }
            onOpenChange(false);
        } catch (err) {
            setError("Une erreur est survenue.");
            toast.error("Échec de l'opération.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{product ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</DialogTitle>
                        <DialogDescription>
                           Remplissez les détails du produit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du produit</Label>
                                <Input id="name" value={formState.name} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input id="category" value={formState.category} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Prix d'achat (DA)</Label>
                                <Input id="purchasePrice" type="number" step="0.1" value={formState.purchasePrice} onChange={handleInputChange} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="price">Prix de vente (DA)</Label>
                                <Input id="price" type="number" step="0.1" value={formState.price} onChange={handleInputChange} required />
                            </div>
                        </div>
                         <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="quantity">Quantité en stock</Label>
                                <Input id="quantity" type="number" value={formState.quantity} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel">Niveau de stock minimum</Label>
                                <Input id="minStockLevel" type="number" value={formState.minStockLevel} onChange={handleInputChange} required />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="barcodes">Codes-barres</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="barcode-input" 
                                    value={currentBarcode}
                                    onChange={(e) => setCurrentBarcode(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBarcode(); } }}
                                />
                                <Button type="button" variant="outline" onClick={handleAddBarcode}>Ajouter</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {formState.barcodes.map(barcode => (
                                    <Badge key={barcode} variant="secondary">
                                        {barcode}
                                        <button type="button" onClick={() => handleRemoveBarcode(barcode)} className="ml-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="imageUrl">URL de l'image (Optionnel)</Label>
                            <Input id="imageUrl" value={formState.imageUrl} onChange={handleInputChange} placeholder="https://exemple.com/image.jpg"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
