
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product, Supplier } from '@/lib/types';
import { Loader2, X, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { dataService } from '@/services/data-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Combobox } from '../ui/combobox';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    categories: string[];
    suppliers: Supplier[];
}

const initialFormState = {
    name: '',
    category: '',
    price: '',
    purchasePrice: '',
    quantity: '',
    minStockLevel: '10',
    barcodes: [] as string[],
    imageUrl: '',
    unite: 'Pièce' as Product['unite'],
    dateExpiration: undefined as Date | undefined,
    fournisseurId: undefined as number | undefined,
};

const units: Product['unite'][] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

export function ProductDialog({ isOpen, onOpenChange, product, categories, suppliers }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [priceWarning, setPriceWarning] = useState(false);
    const [showPriceConfirm, setShowPriceConfirm] = useState(false);

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
                unite: product.unite || 'Pièce',
                dateExpiration: product.dateExpiration ? new Date(product.dateExpiration) : undefined,
                fournisseurId: product.fournisseurId,
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
    }, [product, isOpen]);
    
    useEffect(() => {
        const purchasePriceNum = parseFloat(formState.purchasePrice);
        const priceNum = parseFloat(formState.price);
        setPriceWarning(priceNum < purchasePriceNum);
    }, [formState.price, formState.purchasePrice]);

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

    const proceedWithSubmit = async () => {
        setError(null);
        setIsLoading(true);

        const { name, category, price, purchasePrice, quantity, minStockLevel, barcodes, imageUrl, unite, dateExpiration, fournisseurId } = formState;

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
        
        const productData: Omit<Product, 'id'> = {
            name, category, price: priceNum, purchasePrice: purchasePriceNum, quantity: quantityNum,
            minStockLevel: minStockNum, barcodes, imageUrl, unite, dateExpiration, fournisseurId,
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
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (priceWarning) {
            setShowPriceConfirm(true);
        } else {
            await proceedWithSubmit();
        }
    };
    
    const supplierOptions = suppliers.map(s => ({ value: String(s.id), label: s.name }));

    return (
        <>
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
                                <Select value={formState.category} onValueChange={(value) => setFormState(s => ({ ...s, category: value }))}>
                                    <SelectTrigger id="category"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="purchasePrice">Prix d'achat (DA)</Label>
                                <Input id="purchasePrice" type="number" step="0.1" value={formState.purchasePrice} onChange={handleInputChange} required />
                            </div>
                             <div className="space-y-2 relative">
                                <Label htmlFor="price">Prix de vente (DA)</Label>
                                <Input id="price" type="number" step="0.1" value={formState.price} onChange={handleInputChange} required />
                                {priceWarning && (
                                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                        <AlertTriangle className="h-3 w-3"/>
                                        Le prix de vente est inférieur au prix d'achat.
                                    </p>
                                )}
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
                         <div className="grid md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="unite">Unité</Label>
                                <Select value={formState.unite} onValueChange={(value) => setFormState(s => ({ ...s, unite: value as Product['unite'] }))}>
                                    <SelectTrigger id="unite"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                    <SelectContent>
                                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Date d'expiration (Optionnel)</Label>
                                <DatePicker date={formState.dateExpiration} setDate={(date) => setFormState(s => ({...s, dateExpiration: date }))}/>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Fournisseur (Optionnel)</Label>
                             <Combobox
                                options={supplierOptions}
                                value={formState.fournisseurId ? String(formState.fournisseurId) : ''}
                                onSelect={(value) => setFormState(s => ({ ...s, fournisseurId: value ? parseInt(value) : undefined }))}
                                placeholder="Sélectionner un fournisseur..."
                                searchPlaceholder="Rechercher..."
                                notFoundMessage="Aucun fournisseur trouvé."
                            />
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
         <AlertDialog open={showPriceConfirm} onOpenChange={setShowPriceConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Vente à perte potentielle</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le prix de vente que vous avez saisi est inférieur au prix d'achat. Êtes-vous sûr de vouloir continuer ?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Modifier le prix</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedWithSubmit} className="bg-destructive hover:bg-destructive/80">Continuer quand même</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
