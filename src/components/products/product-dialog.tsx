'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product, Supplier } from '@/lib/types';
import { Loader2, X, AlertTriangle, ChevronsUpDown, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { productService } from '@/services/product.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    categories: string[];
    suppliers: Supplier[];
    onSuccess: () => void;
}

const initialFormState: Partial<Product> & { supplierName?: string } = {
    name: '',
    category: '',
    price: 0,
    purchasePrice: 0,
    quantity: 0,
    minStockLevel: 10,
    barcodes: [],
    imageUrl: '',
    unite: 'Pièce',
    dateExpiration: undefined,
    supplierUuid: undefined,
    supplierName: '',
};

const units: NonNullable<Product['unite']>[] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

export function ProductDialog({ isOpen, onOpenChange, product, categories, suppliers, onSuccess }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPriceConfirm, setShowPriceConfirm] = useState(false);

    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            const supplier = suppliers.find(s => s.uuid === product.supplierUuid);
            setFormState({
                ...product,
                dateExpiration: product.dateExpiration ? new Date(product.dateExpiration) : undefined,
                supplierName: supplier?.name || '',
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
        setSupplierSearch('');
    }, [product, isOpen, suppliers]);
    
    const priceNum = Number(formState.price);
    const purchasePriceNum = Number(formState.purchasePrice);
    const priceWarning = !isNaN(priceNum) && !isNaN(purchasePriceNum) && priceNum > 0 && purchasePriceNum > 0 && priceNum < purchasePriceNum;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleAddBarcode = () => {
        if (currentBarcode.trim() && !formState.barcodes?.includes(currentBarcode.trim())) {
            setFormState(prev => ({ ...prev, barcodes: [...(prev.barcodes || []), currentBarcode.trim()] }));
            setCurrentBarcode('');
        }
    };
    
    const handleRemoveBarcode = (barcodeToRemove: string) => {
        setFormState(prev => ({...prev, barcodes: prev.barcodes?.filter(b => b !== barcodeToRemove)}));
    };

    const supplierOptions = useMemo(() => {
        if (!suppliers) return [];
        if (!supplierSearch) return suppliers;
        return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
    }, [suppliers, supplierSearch]);

    const handleSupplierSelect = (uuid: string) => {
        const selected = suppliers.find(s => s.uuid === uuid);
        if (selected) {
            setFormState(prev => ({ ...prev, supplierUuid: selected.uuid, supplierName: selected.name }));
        }
        setSupplierPopoverOpen(false);
    };

    const handleSupplierCreate = () => {
        setFormState(prev => ({ ...prev, supplierUuid: undefined, supplierName: supplierSearch }));
        setSupplierPopoverOpen(false);
    };

    const handleClearSupplier = () => {
        setFormState(prev => ({ ...prev, supplierUuid: undefined, supplierName: ''}));
        setSupplierPopoverOpen(false);
    }

    const proceedWithSubmit = async () => {
        setError(null);
        setIsLoading(true);

        const productData: Omit<Product, 'uuid' | 'id'> & { supplierName?: string } = {
            name: formState.name!,
            category: formState.category || 'Non classé',
            price: Number(formState.price) || 0,
            purchasePrice: Number(formState.purchasePrice) || 0,
            quantity: Number(formState.quantity) || 0,
            minStockLevel: Number(formState.minStockLevel) || 0,
            barcodes: formState.barcodes || [],
            imageUrl: formState.imageUrl || undefined,
            unite: formState.unite || 'Pièce',
            dateExpiration: formState.dateExpiration || undefined,
            supplierUuid: formState.supplierUuid || undefined,
            supplierName: formState.supplierName || undefined,
        };

        try {
            if (product) {
                await productService.updateProduct(product.uuid, productData);
                toast.success(`Produit ${productData.name} mis à jour.`);
            } else {
                await productService.addProduct(productData as Product);
                toast.success(`Produit ${productData.name} ajouté.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Échec de l'opération.");
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
                            <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                    >
                                        {formState.supplierName || "Sélectionner ou créer un fournisseur..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput 
                                            placeholder="Rechercher ou créer..." 
                                            onValueChange={setSupplierSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <Button 
                                                    variant="link" 
                                                    className="w-full"
                                                    onClick={handleSupplierCreate}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Créer "{supplierSearch}"
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={handleClearSupplier} className="text-muted-foreground">
                                                    Aucun fournisseur
                                                </CommandItem>
                                                {supplierOptions?.map((supplier) => (
                                                    <CommandItem
                                                        key={supplier.uuid}
                                                        value={supplier.uuid}
                                                        onSelect={() => handleSupplierSelect(supplier.uuid)}
                                                    >
                                                        {supplier.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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
                                {formState.barcodes?.map(barcode => (
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
                            <Input id="imageUrl" value={formState.imageUrl || ''} onChange={handleInputChange} placeholder="https://exemple.com/image.jpg"/>
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
