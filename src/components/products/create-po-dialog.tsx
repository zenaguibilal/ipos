
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { Product, PurchaseOrderItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface POItem extends PurchaseOrderItem {
    // local state for the form
}

interface CreatePoDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    products: Product[];
    onCreate: (supplier: string, items: PurchaseOrderItem[]) => Promise<void>;
}

export function CreatePoDialog({ isOpen, onOpenChange, products, onCreate }: CreatePoDialogProps) {
    const [supplier, setSupplier] = useState('');
    const [items, setItems] = useState<POItem[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (products.length > 0) {
            setItems(products.map(p => ({
                productId: p.id,
                productName: p.name,
                quantity: p.minStockLevel > p.quantity ? p.minStockLevel - p.quantity : 10, // Suggest a quantity to re-order
                purchasePrice: p.purchasePrice,
            })));
        }
    }, [products]);

    const handleQuantityChange = (productId: string, quantity: number) => {
        setItems(currentItems => 
            currentItems.map(item => 
                item.productId === productId ? { ...item, quantity: quantity >= 0 ? quantity : 0 } : item
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!supplier.trim()) {
            toast.error("Veuillez spécifier un nom de fournisseur.");
            return;
        }
        
        const validItems = items.filter(item => item.quantity > 0);

        if (validItems.length === 0) {
            toast.error("Veuillez ajouter au moins un produit avec une quantité supérieure à zéro.");
            return;
        }

        setIsCreating(true);
        try {
            await onCreate(supplier, validItems);
        } finally {
            setIsCreating(false);
        }
    };
    
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    
    const handleOpenChange = (open: boolean) => {
        if (!isCreating) {
            onOpenChange(open);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Créer un bon de commande</DialogTitle>
                        <DialogDescription>
                            Ajustez les quantités pour les produits sélectionnés et spécifiez un fournisseur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="supplier-name">Nom du Fournisseur</Label>
                            <Input
                                id="supplier-name"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                required
                                placeholder="Fournisseur Principal"
                            />
                        </div>

                        <ScrollArea className="h-64 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead className="w-[120px] text-right">Prix Achat</TableHead>
                                        <TableHead className="w-[100px] text-right">Quantité</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className="text-right">{item.purchasePrice.toFixed(1)} DA</TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                                                    className="h-8 text-right"
                                                    min="0"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <div className="flex justify-end font-bold text-lg">
                            <span>Valeur Totale: {totalValue.toFixed(1)} DA</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isCreating}>Annuler</Button>
                        <Button type="submit" disabled={isCreating}>
                             {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : 'Créer le bon de commande'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
