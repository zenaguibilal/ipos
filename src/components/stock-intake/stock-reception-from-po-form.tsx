'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product, PurchaseOrder } from '@/lib/types';

interface StockReceptionItem {
    productId: string;
    productName: string;
    quantityOrdered: number;
    quantityReceived: number;
    purchasePrice: number;
}

interface StockReceptionFromPOFormProps {
    userId: string;
    products: Product[];
    purchaseOrder: PurchaseOrder;
    onFinished: () => void;
}

export function StockReceptionFromPOForm({ userId, products, purchaseOrder, onFinished }: StockReceptionFromPOFormProps) {
    const firestore = useFirestore();
    
    const [items, setItems] = useState<StockReceptionItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (purchaseOrder) {
            setItems(purchaseOrder.items.map(item => ({
                ...item,
                quantityOrdered: item.quantity,
                quantityReceived: item.quantity,
            })));
        }
    }, [purchaseOrder]);

    const handleItemChange = (index: number, field: keyof StockReceptionItem, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'quantityReceived' || field === 'purchasePrice') {
             (item[field] as number) = parseFloat(value) || 0;
        } else {
            (item[field] as string) = value;
        }
        
        newItems[index] = item;
        setItems(newItems);
    };

    const totalValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.purchasePrice * item.quantityReceived), 0);
    }, [items]);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (items.some(item => item.quantityReceived < 0 || item.purchasePrice < 0)) {
            toast.error("Les quantités reçues et les prix d'achat ne peuvent pas être négatifs.");
            return;
        }

        if (!firestore) {
            toast.error("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsProcessing(true);

        const batch = writeBatch(firestore);
        const productsRef = collection(firestore, 'users', userId, 'products');

        try {
            // Update product quantities
            for (const item of items) {
                const productRef = doc(productsRef, item.productId);
                const existingProduct = products.find(p => p.id === item.productId);
                if (existingProduct) {
                     const newQuantity = existingProduct.quantity + item.quantityReceived;
                     batch.update(productRef, { 
                        quantity: newQuantity,
                        purchasePrice: item.purchasePrice, // Also update purchase price
                    });
                }
            }

            // Create the stock intake record
            const stockIntakesRef = collection(firestore, 'users', userId, 'stockIntakes');
            const newIntakeRef = doc(stockIntakesRef);
            batch.set(newIntakeRef, {
                invoiceNumber: `PO-${purchaseOrder.poNumber}`,
                invoiceDate: purchaseOrder.createdAt, // Use PO creation date as invoice date
                items: items.map(i => ({ 
                    productId: i.productId, 
                    productName: i.productName, 
                    quantityReceived: i.quantityReceived, 
                    purchasePrice: i.purchasePrice 
                })),
                totalValue: totalValue,
                createdAt: serverTimestamp()
            });

            // Update the purchase order status to 'received'
            const poRef = doc(firestore, 'users', userId, 'purchaseOrders', purchaseOrder.id);
            batch.update(poRef, { status: 'received' });

            await batch.commit();
            toast.success(`Stock mis à jour pour le bon de commande ${purchaseOrder.poNumber}.`);
            onFinished();

        } catch (error) {
            console.error("Error processing stock intake from PO: ", error);
            toast.error("Une erreur est survenue lors de la mise à jour du stock.");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <div className='flex items-center gap-4'>
                        <Button type="button" variant="outline" size="icon" onClick={onFinished}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Réceptionner le Bon de Commande</CardTitle>
                            <CardDescription>
                                Confirmez ou ajustez les quantités reçues pour le bon de commande <span className='font-mono'>{purchaseOrder.poNumber}</span>.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                         <h3 className="text-lg font-medium mb-2">Articles</h3>
                        <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom du produit</TableHead>
                                        <TableHead className="w-[120px]">Qté Commandée</TableHead>
                                        <TableHead className="w-[120px]">Qté Reçue</TableHead>
                                        <TableHead className="w-[150px]">Prix Achat (Unitaire)</TableHead>
                                        <TableHead className="w-[150px] text-right">Sous-total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.quantityOrdered}
                                                    disabled
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.quantityReceived}
                                                    onChange={(e) => handleItemChange(index, 'quantityReceived', e.target.value)}
                                                    required
                                                    min="0"
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
                                                {(item.purchasePrice * item.quantityReceived).toFixed(2)} DA
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col items-end gap-4 border-t pt-6">
                    <div className="text-xl font-bold">
                        Total Réceptionné: {totalValue.toFixed(2)} DA
                    </div>
                     <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement en cours...
                            </>
                        ) : 'Confirmer la réception et mettre à jour le stock'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
