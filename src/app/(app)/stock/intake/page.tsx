'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, runTransaction, writeBatch, serverTimestamp, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, Trash2, ArrowLeft, Save, Loader2, Barcode } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Product, StockIntakeItem } from '@/lib/types';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';


export default function StockIntakePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [supplier, setSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [barcode, setBarcode] = useState('');

    const productsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'products')) : null, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const productOptions = useMemo<ComboboxOption[]>(() => 
        products?.map(p => ({ value: p.id, label: p.name, subLabel: `Stock: ${p.quantity}` })) || [],
    [products]);
    
    const handleItemChange = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    
    const handleBarcodeScanned = useCallback((scannedBarcode: string) => {
        if (!scannedBarcode.trim() || !products) return;
    
        const product = products.find(p => p.barcodes?.includes(scannedBarcode.trim()));
    
        if (product) {
            setItems(prevItems => {
                const existingItem = prevItems.find(i => !i.isNew && i.productId === product.id);
                if (existingItem) {
                    toast.info(`Quantité pour ${product.name} augmentée.`);
                    return prevItems.map(item => 
                        item.id === existingItem.id 
                            ? { ...item, quantity: item.quantity + 1 } 
                            : item
                    );
                } else {
                    toast.success(`${product.name} ajouté à la liste.`);
                    const newItem: StockIntakeItem = {
                        id: uuidv4(),
                        productId: product.id,
                        name: product.name,
                        category: product.category || '',
                        barcodes: product.barcodes || [],
                        quantity: 1,
                        purchasePrice: product.purchasePrice,
                        price: product.price,
                        isNew: false,
                    };
                    return [newItem, ...prevItems];
                }
            });
        } else {
            toast.error('Aucun produit trouvé pour ce code-barres.');
        }
        setBarcode('');
    }, [products]);


    const addNewItem = () => {
        setItems(prev => [...prev, {
            id: uuidv4(),
            productId: undefined,
            name: '',
            category: '',
            barcodes: [],
            quantity: 1,
            purchasePrice: 0,
            price: 0,
            isNew: true,
        }]);
    };

    const handleProductSelect = (itemId: string, productId: string) => {
        const product = products?.find(p => p.id === productId);
        if (!product) return;
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    productId: product.id,
                    name: product.name,
                    category: product.category || '',
                    barcodes: product.barcodes || [],
                    purchasePrice: product.purchasePrice,
                    price: product.price,
                    isNew: false,
                }
            }
            return item;
        }));
    };
    
    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };
    
    const totalValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    }, [items]);

    const handleSaveIntake = async () => {
        if (!supplier || !invoiceNumber) {
            toast.error("Le fournisseur et le numéro de facture sont requis.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un article.");
            return;
        }
        if (!user || !firestore) {
            toast.error("Utilisateur non authentifié ou service indisponible.");
            return;
        }

        setIsSaving(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const intakeRef = doc(collection(firestore, 'users', user.uid, 'stockIntakes'));
                
                const intakeItemsForDb = [];

                for (const item of items) {
                    if (!item.name || item.quantity <= 0 || item.purchasePrice < 0 || item.price < 0) {
                        throw new Error(`Ligne invalide pour le produit: ${item.name || 'inconnu'}. Vérifiez les champs.`);
                    }

                    let productId = item.productId;

                    if (item.isNew) { // Create new product
                        const newProductRef = doc(collection(firestore, 'users', user.uid, 'products'));
                        transaction.set(newProductRef, {
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            purchasePrice: item.purchasePrice,
                            quantity: item.quantity,
                            minStockLevel: 1, // Default min stock
                            barcodes: item.barcodes,
                            createdAt: serverTimestamp(),
                            imageUrl: '',
                        });
                        productId = newProductRef.id;
                    } else if(productId) { // Update existing product
                        const productRef = doc(firestore, 'users', user.uid, 'products', productId);
                        const productDoc = await transaction.get(productRef);
                        if (!productDoc.exists()) throw new Error(`Produit avec ID ${productId} non trouvé.`);
                        
                        const currentQuantity = productDoc.data().quantity;
                        const newQuantity = currentQuantity + item.quantity;
                        
                        transaction.update(productRef, {
                            quantity: newQuantity,
                            purchasePrice: item.purchasePrice, // Update purchase price
                            price: item.price, // Update selling price
                        });
                    }
                    
                    intakeItemsForDb.push({
                        productId: productId,
                        productName: item.name,
                        quantityReceived: item.quantity,
                        purchasePrice: item.purchasePrice,
                    });
                }
                
                // Save the stock intake record
                transaction.set(intakeRef, {
                    supplier,
                    invoiceNumber,
                    invoiceDate: new Date(invoiceDate),
                    items: intakeItemsForDb,
                    totalValue,
                    createdAt: serverTimestamp(),
                });
            });

            toast.success("Réception de stock enregistrée avec succès !");
            router.push('/stock');

        } catch (error: any) {
            console.error("Stock intake failed: ", error);
            toast.error(error.message || "Une erreur est survenue.");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/stock">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'historique
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Enregistrer une nouvelle réception</CardTitle>
                    <CardDescription>Mettez à jour votre inventaire en enregistrant une livraison fournisseur.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Fournisseur</Label>
                            <Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">N° Facture Fournisseur</Label>
                            <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDate">Date Facture</Label>
                            <Input id="invoiceDate" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                         <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                             <div className="relative w-full md:max-w-sm">
                                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Scanner un code-barres pour ajouter un produit..."
                                    className="pl-9"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleBarcodeScanned(e.currentTarget.value);
                                        }
                                    }}
                                />
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={addNewItem}><PlusCircle className="mr-2 h-4 w-4"/>Ajouter une ligne manuellement</Button>
                        </div>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Produit</TableHead>
                                        <TableHead className="w-[150px]">Catégorie</TableHead>
                                        <TableHead className="w-[200px]">Codes-barres</TableHead>
                                        <TableHead className="w-[100px]">Qté</TableHead>
                                        <TableHead className="w-[120px]">Prix Achat</TableHead>
                                        <TableHead className="w-[120px]">Prix Vente</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.isNew ? (
                                                     <Input placeholder="Nom du nouveau produit..." value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                                ) : (
                                                    <Combobox
                                                        options={productOptions}
                                                        onSelect={(productId) => handleProductSelect(item.id, productId)}
                                                        value={item.productId || ''}
                                                        placeholder="Chercher produit..."
                                                        searchPlaceholder="Rechercher un produit..."
                                                        notFoundMessage="Aucun produit trouvé."
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input placeholder="Catégorie..." value={item.category || ''} onChange={e => handleItemChange(item.id, 'category', e.target.value)} disabled={!item.isNew} />
                                            </TableCell>
                                             <TableCell>
                                                <Input 
                                                    placeholder="CB1, CB2,..." 
                                                    value={(item.barcodes || []).join(', ')} 
                                                    onChange={e => handleItemChange(item.id, 'barcodes', e.target.value.split(',').map(b => b.trim()).filter(b => b))} 
                                                    disabled={!item.isNew} 
                                                />
                                            </TableCell>
                                            <TableCell><Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}/></TableCell>
                                            <TableCell><Input type="number" step="0.1" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}/></TableCell>
                                            <TableCell><Input type="number" step="0.1" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} /></TableCell>
                                            <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-xl font-bold">Valeur Totale : {totalValue.toFixed(1)} DA</div>
                        <Button onClick={handleSaveIntake} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Enregistrer la réception
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </main>
    );
}
