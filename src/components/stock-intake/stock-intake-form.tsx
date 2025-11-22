'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/lib/types';

interface StockIntakeItem {
    id: string;
    productId?: string;
    barcode: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
}

type ProductWithOptionalBarcode = Product & { barcode?: string };


interface StockIntakeFormProps {
    userId: string;
    products: ProductWithOptionalBarcode[];
}

const createNewItem = (): StockIntakeItem => ({
    id: `temp-${Date.now()}-${Math.random()}`,
    barcode: '',
    name: '',
    quantity: 1,
    purchasePrice: 0,
    price: 0,
    isNew: true
});

export function StockIntakeForm({ userId, products }: StockIntakeFormProps) {
    const firestore = useFirestore();
    const barcodeRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [items, setItems] = useState<StockIntakeItem[]>([createNewItem()]);
    const [isProcessing, setIsProcessing] = useState(false);

    const productsByBarcode = useMemo(() => {
        return products.reduce((acc, product) => {
            if (product.barcodes && product.barcodes.length > 0) {
                 product.barcodes.forEach(barcode => {
                    acc[barcode] = product;
                });
            }
            if (product.barcode) { // Handle old single barcode
                acc[product.barcode] = product;
            }
            return acc;
        }, {} as Record<string, ProductWithOptionalBarcode>);
    }, [products]);
    
    const handleItemChange = (index: number, field: keyof StockIntakeItem, value: any) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'barcode') {
            const existingProduct = productsByBarcode[value];
            if (existingProduct) {
                item.productId = existingProduct.id;
                item.name = existingProduct.name;
                item.purchasePrice = existingProduct.purchasePrice;
                item.price = existingProduct.price;
                item.isNew = false;
            } else {
                 // If barcode doesn't match, treat as potentially new item
                 item.productId = undefined;
                 item.isNew = true;
            }
        }
        
        // Ensure numeric fields are numbers
        if (field === 'quantity' || field === 'purchasePrice' || field === 'price') {
             (item[field] as number) = parseFloat(value) || 0;
        } else {
            (item[field] as string) = value;
        }
        
        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, createNewItem()]);
    };
    
    useEffect(() => {
        barcodeRefs.current[items.length - 1]?.focus();
    }, [items.length]);

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const totalValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    }, [items]);
    
    const resetForm = () => {
        setInvoiceNumber('');
        setInvoiceDate(new Date());
        setItems([createNewItem()]);
        setIsProcessing(false);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!invoiceNumber.trim()) {
            toast.error("Veuillez entrer un numéro de facture.");
            return;
        }
        if (!invoiceDate) {
            toast.error("Veuillez choisir une date pour la facture.");
            return;
        }
        if (items.some(item => !item.name.trim() || item.quantity <= 0 || item.purchasePrice < 0)) {
            toast.error("Veuillez vérifier que tous les articles ont un nom, une quantité positive et un prix d'achat valide.");
            return;
        }
         if (items.some(item => item.isNew && item.price <= 0)) {
            toast.error("Les nouveaux produits doivent avoir un prix de vente supérieur à zéro.");
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
            for (const item of items) {
                let productId = item.productId;

                if (item.isNew) {
                    const newProductRef = doc(productsRef);
                    productId = newProductRef.id; 
                    batch.set(newProductRef, {
                        name: item.name,
                        barcodes: item.barcode ? [item.barcode] : [],
                        quantity: item.quantity,
                        purchasePrice: item.purchasePrice,
                        price: item.price,
                        minStockLevel: 10,
                        createdAt: serverTimestamp(),
                    });
                } else if (productId) {
                    const productRef = doc(productsRef, productId);
                    const existingProduct = products.find(p => p.id === productId);
                    if (existingProduct) {
                         const newQuantity = existingProduct.quantity + item.quantity;
                         batch.update(productRef, { 
                            quantity: newQuantity,
                            purchasePrice: item.purchasePrice,
                            price: item.price
                        });
                    }
                }
            }

            // Also save the stock intake record itself
            const stockIntakesRef = collection(firestore, 'users', userId, 'stockIntakes');
            const newIntakeRef = doc(stockIntakesRef);
            batch.set(newIntakeRef, {
                invoiceNumber: invoiceNumber,
                invoiceDate: serverTimestamp.fromDate(invoiceDate),
                items: items.map(i => ({ 
                    productId: i.productId, 
                    productName: i.name, 
                    quantityReceived: i.quantity, 
                    purchasePrice: i.purchasePrice 
                })),
                totalValue: totalValue,
                createdAt: serverTimestamp()
            });


            await batch.commit();
            toast.success("Le stock a été mis à jour avec succès !");
            resetForm();

        } catch (error) {
            console.error("Error processing stock intake: ", error);
            toast.error("Une erreur est survenue lors de la mise à jour du stock.");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Réception de Stock</CardTitle>
                    <CardDescription>
                        Entrez les détails de la facture fournisseur et les produits reçus pour mettre à jour votre inventaire.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">Numéro de Facture</Label>
                            <Input
                                id="invoiceNumber"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDate">Date de la Facture</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="invoiceDate"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !invoiceDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {invoiceDate ? format(invoiceDate, "d LLL yyyy", { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={invoiceDate}
                                    onSelect={setInvoiceDate}
                                    initialFocus
                                    locale={fr}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    
                    <div>
                         <h3 className="text-lg font-medium mb-2">Articles Reçus</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Code-barres</TableHead>
                                        <TableHead>Nom du produit</TableHead>
                                        <TableHead className="w-[100px]">Quantité</TableHead>
                                        <TableHead className="w-[120px]">Prix Achat</TableHead>
                                        <TableHead className="w-[120px]">Prix Vente</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input
                                                    ref={(el) => barcodeRefs.current[index] = el}
                                                    placeholder="Scanner..."
                                                    value={item.barcode}
                                                    onChange={(e) => handleItemChange(index, 'barcode', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    placeholder="Nom de l'article"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                    required
                                                    disabled={!item.isNew}
                                                />
                                            </TableCell>
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
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                    required
                                                    step="0.01"
                                                     min="0"
                                                     disabled={!item.isNew}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                 <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length <= 1}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un article
                        </Button>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col items-end gap-4 border-t pt-6">
                    <div className="text-xl font-bold">
                        Total Facture: {totalValue.toFixed(2)} DA
                    </div>
                     <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Traitement en cours...
                            </>
                        ) : 'Valider la réception'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
    
