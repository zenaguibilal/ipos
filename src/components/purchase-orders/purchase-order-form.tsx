
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product, PurchaseOrderItem, CompanyProfile } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Check } from 'lucide-react';

interface PurchaseOrderFormProps {
    userId: string;
    products: Product[];
}

const createNewItem = (product?: Product): PurchaseOrderItem => ({
    productId: product?.id || '',
    productName: product?.name || '',
    quantity: 1,
    purchasePrice: product?.purchasePrice || 0,
});


export function PurchaseOrderForm({ userId, products }: PurchaseOrderFormProps) {
    const firestore = useFirestore();
    
    const [supplierName, setSupplierName] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [openProductSearch, setOpenProductSearch] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState("");

    const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'quantity' || field === 'purchasePrice') {
             (item[field] as number) = parseFloat(value) || 0;
        } else {
            (item[field] as string) = value;
        }
        
        newItems[index] = item;
        setItems(newItems);
    };

    const addProductToOrder = (product: Product) => {
        // Check if product is already in the list
        if (items.some(item => item.productId === product.id)) {
            toast.info(`"${product.name}" est déjà sur le bon de commande.`);
            return;
        }
        setItems([...items, createNewItem(product)]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const totalValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    }, [items]);
    
    const resetForm = () => {
        setSupplierName('');
        setNotes('');
        setItems([]);
        setIsProcessing(false);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!supplierName.trim()) {
            toast.error("Veuillez entrer un nom de fournisseur.");
            return;
        }
       
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un produit au bon de commande.");
            return;
        }

        if (items.some(item => !item.productName || item.quantity <= 0 || item.purchasePrice < 0)) {
            toast.error("Veuillez vérifier que tous les articles ont un nom, une quantité positive et un prix d'achat valide.");
            return;
        }

        if (!firestore) {
            toast.error("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsProcessing(true);
        const poCollectionRef = collection(firestore, 'users', userId, 'purchaseOrders');
        const newPoRef = doc(poCollectionRef);

        const poData = {
            poNumber: newPoRef.id.substring(0, 8).toUpperCase(),
            supplierName: supplierName,
            status: 'draft',
            items: items.map(i => ({ 
                productId: i.productId, 
                productName: i.productName, 
                quantity: i.quantity, 
                purchasePrice: i.purchasePrice 
            })),
            totalValue: totalValue,
            notes: notes,
            createdAt: serverTimestamp()
        };

        addDocumentNonBlocking(poCollectionRef, poData, {
            onSuccess: () => {
                toast.success(`Bon de commande ${poData.poNumber} créé avec succès.`);
                resetForm();
            },
            onError: (err) => {
                console.error("Error creating purchase order: ", err);
                toast.error("Une erreur est survenue lors de la création du bon de commande.");
                setIsProcessing(false);
            }
        });
    };

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery) return products;
        return products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()));
    }, [products, productSearchQuery]);

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Nouveau Bon de Commande</CardTitle>
                    <CardDescription>
                        Créez un bon de commande à envoyer à votre fournisseur.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplierName">Nom du Fournisseur</Label>
                            <Input
                                id="supplierName"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                required
                                placeholder="Nom du fournisseur principal"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optionnel)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Instructions spéciales, conditions de livraison, etc."
                            />
                        </div>
                    </div>
                    
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Articles à commander</h3>
                            <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Ajouter un produit
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput 
                                            placeholder="Rechercher un produit..." 
                                            value={productSearchQuery}
                                            onValueChange={setProductSearchQuery}
                                        />
                                        <CommandList>
                                            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredProducts.map(product => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() => {
                                                            addProductToOrder(product);
                                                            setOpenProductSearch(false);
                                                            setProductSearchQuery("");
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", items.some(i => i.productId === product.id) ? "opacity-100" : "opacity-0")} />
                                                        {product.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                         </div>
                        {items.length > 0 ? (
                            <div className="overflow-x-auto border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom du produit</TableHead>
                                            <TableHead className="w-[120px]">Quantité</TableHead>
                                            <TableHead className="w-[150px]">Prix Achat (Unitaire)</TableHead>
                                            <TableHead className="w-[150px] text-right">Sous-total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        required
                                                        min="1"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        onChange={(e) => handleItemChange(index, 'purchasePrice', e.target.value)}
                                                        required
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {(item.purchasePrice * item.quantity).toFixed(2)} DA
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-md">
                                <p className="text-muted-foreground">Aucun article ajouté.</p>
                                <p className="text-sm text-muted-foreground">Utilisez le bouton "Ajouter un produit" pour commencer.</p>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col items-end gap-4 border-t pt-6">
                    <div className="text-xl font-bold">
                        Total du Bon de Commande: {totalValue.toFixed(2)} DA
                    </div>
                     <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing || items.length === 0}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Création en cours...
                            </>
                        ) : 'Créer le bon de commande'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

    