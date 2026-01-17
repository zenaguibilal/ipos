
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, writeBatch, serverTimestamp, doc, runTransaction, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/stock-intake/date-picker';
import { ScannerInput } from '@/components/stock-intake/scanner-input';
import { IntakeItemsTable } from '@/components/stock-intake/items-table';
import { SaveIntakeDialog } from '@/components/stock-intake/save-intake-dialog';
import { AddNewProductDialog } from '@/components/stock-intake/add-new-product-dialog';
import { History, Save, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Product, PurchaseOrder, StockIntakeItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductSearchCombobox } from '@/components/stock-intake/product-search-combobox';

export default function StockIntakePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data fetching
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
    
    const pendingPOsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'purchaseOrders'), where('status', '==', 'pending'));
    }, [user, firestore]);
    const { data: pendingPOs, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(pendingPOsQuery);

    // Page State
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [intakeItems, setIntakeItems] = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState<string | 'none'>('none');
    const [newProductInfo, setNewProductInfo] = useState<{ scannedCode: string } | null>(null);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const updateItem = useCallback((itemId: string, field: keyof StockIntakeItem, value: any) => {
        setIntakeItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'barcodes' && typeof value === 'string') {
                    updatedItem.barcodes = value.split(',').map(b => b.trim()).filter(Boolean);
                }
                return updatedItem;
            }
            return item;
        }));
    }, []);

    const addOrIncrementProduct = useCallback((product: Product) => {
        const itemInList = intakeItems.find(item => item.productId === product.id);
        if (itemInList) {
            updateItem(itemInList.id, 'quantity', itemInList.quantity + 1);
            toast.info(`Quantité pour "${product.name}" augmentée.`);
        } else {
            setIntakeItems(prev => [...prev, {
                id: `item-${Date.now()}`,
                productId: product.id,
                barcodes: product.barcodes || [],
                name: product.name,
                category: product.category || '',
                quantity: 1,
                purchasePrice: product.purchasePrice,
                price: product.price,
                isNew: false,
            }]);
            toast.info(`"${product.name}" ajouté à la liste.`);
        }
    }, [intakeItems, updateItem]);

    const handleScannedItem = (scannedValue: string) => {
        if (!products) return;

        const lowercasedValue = scannedValue.toLowerCase();
        const existingProduct = products.find(p => 
            (p.barcodes && p.barcodes.includes(scannedValue)) || 
            p.name.toLowerCase() === lowercasedValue
        );

        if (existingProduct) {
            addOrIncrementProduct(existingProduct);
        } else {
            setNewProductInfo({ scannedCode: scannedValue });
        }
    };
    
     const handleAddProductFromSearch = (productId: string) => {
        if (!products) return;
        const productToAdd = products.find(p => p.id === productId);
        if (productToAdd) {
            addOrIncrementProduct(productToAdd);
        }
    };
    
    const handleConfirmNewProduct = (newItem: StockIntakeItem) => {
        setIntakeItems(prev => [newItem, ...prev]);
        setNewProductInfo(null);
        toast.success(`Nouveau produit "${newItem.name}" ajouté à la liste.`);
    };

    const removeItem = useCallback((itemId: string) => {
        setIntakeItems(prev => prev.filter(item => item.id !== itemId));
    }, []);

    const handleSelectPO = (poId: string) => {
        setSelectedPOId(poId);

        if (poId === 'none') {
            setIntakeItems([]);
            setInvoiceNumber('');
            return;
        }

        const selectedPO = pendingPOs?.find(po => po.id === poId);
        if (!selectedPO || !products) return;

        setInvoiceNumber(selectedPO.supplier);

        const itemsFromPO: StockIntakeItem[] = selectedPO.items.map(poItem => {
            const productDetails = products.find(p => p.id === poItem.productId);
            return {
                id: `item-${poItem.productId}-${Date.now()}`,
                productId: poItem.productId,
                barcodes: productDetails?.barcodes || [],
                name: poItem.productName,
                category: productDetails?.category || '',
                quantity: poItem.quantity,
                purchasePrice: poItem.purchasePrice,
                price: productDetails?.price || 0,
                isNew: !productDetails,
            };
        });
        setIntakeItems(itemsFromPO);
    };
    
    const handleSaveIntake = async () => {
        if (!firestore || !user) return toast.error("Le service de base de données n'est pas disponible.");
        if (intakeItems.length === 0) return toast.error("La liste de réception est vide.");
        
        for(const item of intakeItems) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0 || item.price < 0) {
                 return toast.error(`Veuillez remplir toutes les informations pour le produit "${item.name || 'Inconnu'}"`);
            }
        }
        
        setIsSaving(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const productsRef = collection(firestore, 'users', user.uid, 'products');

                for (const item of intakeItems) {
                    let productRef;
                    let productId = item.productId;

                    if (item.isNew || !productId) {
                        productRef = doc(productsRef);
                        productId = productRef.id;
                        transaction.set(productRef, {
                            name: item.name,
                            quantity: item.quantity,
                            purchasePrice: item.purchasePrice,
                            price: item.price,
                            barcodes: item.barcodes,
                            category: item.category,
                            minStockLevel: 0,
                            createdAt: serverTimestamp()
                        });
                    } else {
                        productRef = doc(firestore, 'users', user.uid, 'products', productId);
                        const productDoc = await transaction.get(productRef);
                        if (productDoc.exists()) {
                            const currentQuantity = productDoc.data().quantity || 0;
                            transaction.update(productRef, {
                                quantity: currentQuantity + item.quantity,
                                purchasePrice: item.purchasePrice,
                                price: item.price,
                                barcodes: item.barcodes,
                                category: item.category,
                            });
                        } else {
                             // If product somehow doesn't exist, create it.
                             transaction.set(productRef, {
                                name: item.name,
                                quantity: item.quantity,
                                purchasePrice: item.purchasePrice,
                                price: item.price,
                                barcodes: item.barcodes,
                                category: item.category,
                                minStockLevel: 0,
                                createdAt: serverTimestamp()
                            });
                        }
                    }
                }
                
                if (selectedPOId !== 'none') {
                    const poRef = doc(firestore, 'users', user.uid, 'purchaseOrders', selectedPOId);
                    transaction.update(poRef, { status: 'received' });
                }

                const intakeRef = doc(collection(firestore, 'users', user.uid, 'stockIntakes'));
                transaction.set(intakeRef, {
                    invoiceNumber: invoiceNumber || `intake-${Date.now()}`,
                    invoiceDate: invoiceDate || new Date(),
                    items: intakeItems.map(item => ({
                        productId: item.productId,
                        productName: item.name,
                        quantityReceived: item.quantity,
                        purchasePrice: item.purchasePrice,
                    })),
                    totalValue: totalValue,
                    createdAt: serverTimestamp()
                });
            });

            toast.success("Réception de stock enregistrée et inventaire mis à jour !");
            setIntakeItems([]);
            setInvoiceNumber('');
            setInvoiceDate(new Date());
            setSelectedPOId('none');

        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la réception :", error);
            toast.error("Une erreur est survenue. L'inventaire n'a pas été mis à jour.");
        } finally {
            setIsSaving(false);
            setIsSaveDialogOpen(false);
        }
    };
    
    const totalValue = useMemo(() => {
        return intakeItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    }, [intakeItems]);

    const isLoading = isUserLoading || isLoadingProducts || isLoadingPOs;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <SaveIntakeDialog 
                isOpen={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                onConfirm={handleSaveIntake}
                isSaving={isSaving}
                totalItems={intakeItems.length}
                totalValue={totalValue}
            />
            {newProductInfo && (
                <AddNewProductDialog
                    isOpen={!!newProductInfo}
                    onOpenChange={() => setNewProductInfo(null)}
                    scannedCode={newProductInfo.scannedCode}
                    onConfirm={handleConfirmNewProduct}
                />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full bg-card">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-2xl">Réception de Stock</CardTitle>
                                <CardDescription>
                                    Scannez, sélectionnez un BC, ou ajoutez manuellement des produits pour mettre à jour l'inventaire.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/stock-intake/history">
                                        <History className="mr-2 h-4 w-4" />
                                        Historique
                                    </Link>
                                </Button>
                                 <Button onClick={() => setIsSaveDialogOpen(true)} disabled={intakeItems.length === 0 || isSaving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 pt-4">
                             <div>
                                <Label htmlFor="purchase-order">Bon de Commande (Optionnel)</Label>
                                 <Select onValueChange={handleSelectPO} value={selectedPOId} disabled={isLoadingPOs}>
                                     <SelectTrigger id="purchase-order">
                                         <SelectValue placeholder="Sélectionner un BC..." />
                                     </SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="none">Aucun</SelectItem>
                                        {(pendingPOs || []).map(po => (
                                            <SelectItem key={po.id} value={po.id}>
                                               {po.poNumber} - {po.supplier}
                                            </SelectItem>
                                        ))}
                                     </SelectContent>
                                 </Select>
                             </div>
                             <div>
                                <Label htmlFor="invoice-number">Réf. ou N° Facture Fournisseur</Label>
                                <Input 
                                    id="invoice-number"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="Ex: Facture #123 ou Fournisseur X"
                                />
                             </div>
                             <div>
                                <Label>Date de la Facture</Label>
                                <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                           <ScannerInput onScan={handleScannedItem} />
                            <div className="space-y-1">
                                <Label>Ou rechercher / ajouter un produit</Label>
                                <div className="flex gap-2">
                                    <ProductSearchCombobox 
                                        products={products || []}
                                        onProductSelect={handleAddProductFromSearch}
                                        disabled={!products}
                                        className="w-full"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-12 w-12 flex-shrink-0" 
                                        onClick={() => setNewProductInfo({ scannedCode: '' })} 
                                        title="Ajouter un nouveau produit manuellement"
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                           </div>
                        </div>

                        <IntakeItemsTable
                            items={intakeItems}
                            onUpdateItem={updateItem}
                            onRemoveItem={removeItem}
                        />

                         {intakeItems.length > 0 && (
                             <div className="mt-6 flex justify-end">
                                 <div className="w-full max-w-sm space-y-2 rounded-lg bg-muted p-4">
                                     <div className="flex justify-between font-semibold">
                                         <span>Valeur Totale de la Réception</span>
                                         <span>{totalValue.toFixed(2)} DA</span>
                                     </div>
                                      <div className="flex justify-between text-sm text-muted-foreground">
                                         <span>Nombre d'articles uniques</span>
                                         <span>{intakeItems.length}</span>
                                     </div>
                                 </div>
                             </div>
                         )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
