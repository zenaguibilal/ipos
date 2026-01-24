
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, X, Trash2, Minus, Plus, User, FilePlus2, CheckCircle, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, Customer, SaleItem, CompanyProfile, Sale } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { v4 as uuidv4 } from 'uuid';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { SaleCompleteDialog } from '@/components/sales/sale-complete-dialog';
import { AddCustomProductDialog } from '@/components/sales/add-custom-product-dialog';


// Define Cart types locally
type CartItem = SaleItem & { cartQuantity: number };
interface Cart {
  id: string;
  name: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data Fetching
    const productsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'products')) : null, [user, firestore]);
    const customersQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'customers')) : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    // Component State
    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartId] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [isCustomProductDialogOpen, setIsCustomProductDialogOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [completedSaleCustomer, setCompletedSaleCustomer] = useState<Customer | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');
    const [isSavingSale, setIsSavingSale] = useState(false);
    const [isClearCartDialogOpen, setIsClearCartDialogOpen] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Initialize carts on component mount
    useEffect(() => {
        setIsClient(true);
        if (carts.length === 0) {
            const firstCartId = addNewCart();
            setActiveCartId(firstCartId);
        }
        // Focus barcode input on page load
        barcodeInputRef.current?.focus();
    }, []);
    
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'i') {
                event.preventDefault();
                barcodeInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addNewCart = () => {
        const newCartId = uuidv4();
        setCarts(prev => [...prev, {
            id: newCartId,
            name: `Panier ${prev.length + 1}`,
            items: [],
            customerId: null,
            customerName: 'Vente au comptoir',
            discountType: 'fixed',
            discountValue: 0
        }]);
        return newCartId;
    };

    const handleTabChange = (value: string) => {
        setActiveCartId(value);
        barcodeInputRef.current?.focus();
    };

    const handleAddTab = () => {
        if (carts.length >= 5) {
            toast.warning("Vous ne pouvez avoir que 5 paniers ouverts à la fois.");
            return;
        }
        const newId = addNewCart();
        setActiveCartId(newId);
    };

    const handleRemoveTab = (e: React.MouseEvent, cartIdToRemove: string) => {
        e.stopPropagation();
        if (carts.length === 1) {
            toast.error("Vous ne pouvez pas fermer le dernier panier.");
            return;
        }
        const cartIndex = carts.findIndex(c => c.id === cartIdToRemove);
        const newCarts = carts.filter(c => c.id !== cartIdToRemove);
        setCarts(newCarts);
        if (activeCartId === cartIdToRemove) {
            const newActiveIndex = Math.max(0, cartIndex - 1);
            setActiveCartId(newCarts[newActiveIndex].id);
        }
    };
    
    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    const updateCart = (updatedCart: Cart) => {
        setCarts(prev => prev.map(c => c.id === updatedCart.id ? updatedCart : c));
    };

    const addProductToCart = (product: Product, quantity = 1) => {
        if (!activeCart) return;

        if (product.quantity < quantity) {
            toast.error(`Stock insuffisant pour ${product.name}. Disponible : ${product.quantity}`);
            return;
        }

        const existingItem = activeCart.items.find(item => item.id === product.id);
        let newItems;
        if (existingItem) {
            const newQuantity = existingItem.cartQuantity + quantity;
            if(product.quantity < newQuantity) {
                toast.error(`Stock insuffisant pour ${product.name}. Disponible : ${product.quantity}, Dans le panier : ${existingItem.cartQuantity}`);
                return;
            }
            newItems = activeCart.items.map(item =>
                item.id === product.id ? { ...item, cartQuantity: newQuantity } : item
            );
        } else {
            newItems = [...activeCart.items, { ...product, cartQuantity: quantity }];
        }
        updateCart({ ...activeCart, items: newItems });
        toast.success(`${product.name} ajouté au panier.`);
    };

    const addCustomProductToCart = (name: string, price: number) => {
        if (!activeCart) return;

        const newItem: CartItem = {
            id: `custom-${uuidv4()}`,
            name,
            price,
            purchasePrice: 0,
            quantity: Infinity, // Not a stock-managed item
            cartQuantity: 1,
        };

        const newItems = [...activeCart.items, newItem];
        updateCart({ ...activeCart, items: newItems });
        toast.success(`${name} ajouté au panier.`);
    };

    const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = e.currentTarget.value.trim();
            if (!barcode) return;

            const foundProduct = products?.find(p => p.barcodes?.includes(barcode));
            if (foundProduct) {
                addProductToCart(foundProduct);
            } else {
                toast.error(`Produit non trouvé pour le code-barres : ${barcode}`);
            }
            e.currentTarget.value = ''; // Clear input after scan
        }
    };

    const updateItemQuantity = (productId: string, newQuantity: number) => {
        if (!activeCart) return;
        
        if (newQuantity <= 0) {
            const newItems = activeCart.items.filter(item => item.id !== productId);
            updateCart({ ...activeCart, items: newItems });
            return;
        }

        const productInStock = products?.find(p => p.id === productId);
        if (productInStock && productInStock.quantity < newQuantity) {
            toast.error(`Stock insuffisant pour ${productInStock.name}. Disponible : ${productInStock.quantity}`);
            return;
        }

        const newItems = activeCart.items.map(item =>
            item.id === productId ? { ...item, cartQuantity: newQuantity } : item
        );
        updateCart({ ...activeCart, items: newItems });
    };

    const customerOptions: ComboboxOption[] = useMemo(() => {
        const options: ComboboxOption[] = customers?.map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`
        })) || [];
        options.unshift({ value: 'walk-in', label: 'Vente au comptoir' });
        return options;
    }, [customers]);

    const handleCustomerSelect = (customerId: string) => {
        if (!activeCart) return;
        if (customerId === 'new') {
            setIsAddCustomerOpen(true);
        } else if (customerId === 'walk-in') {
            updateCart({ ...activeCart, customerId: null, customerName: 'Vente au comptoir' });
        } else {
            const customer = customers?.find(c => c.id === customerId);
            if (customer) {
                updateCart({ ...activeCart, customerId: customer.id, customerName: `${customer.firstName} ${customer.lastName}` });
            }
        }
    };

    const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeCart) return;
        updateCart({ ...activeCart, discountValue: parseFloat(e.target.value) || 0 });
    };
    
    const handleDiscountTypeChange = (type: 'fixed' | 'percentage') => {
        if (!activeCart) return;
        updateCart({ ...activeCart, discountType: type });
    };

    const { subtotal, discount, total } = useMemo(() => {
        if (!activeCart) return { subtotal: 0, discount: 0, total: 0 };
        const sub = activeCart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        let disc = 0;
        if(activeCart.discountType === 'fixed') {
            disc = activeCart.discountValue;
        } else {
            disc = sub * (activeCart.discountValue / 100);
        }
        const tot = sub - disc;
        return { subtotal: sub, discount: disc, total: tot > 0 ? tot : 0 };
    }, [activeCart]);


    const handleFinalizeSale = async () => {
        if (!activeCart || activeCart.items.length === 0 || !user || !firestore) return;
        setIsSavingSale(true);

        const batch = writeBatch(firestore);
        const saleId = doc(collection(firestore, 'users', user.uid, 'sales')).id;
        const saleRef = doc(firestore, 'users', user.uid, 'sales', saleId);
        
        let finalPaymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        const amountPaidNum = parseFloat(amountPaid) || 0;
        const remainingBalance = total - amountPaidNum;
        if (amountPaidNum >= total) finalPaymentStatus = 'paid';
        else if (amountPaidNum > 0) finalPaymentStatus = 'partial';

        try {
            // Map cart items to sale items for DB, separating real product IDs
            const saleItemsForDb: SaleItem[] = [];
            const productIdsToUpdate: string[] = [];
            for (const item of activeCart.items) {
                saleItemsForDb.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: item.cartQuantity, // Use cartQuantity as the final quantity
                });
                if (!item.id.startsWith('custom-')) {
                    productIdsToUpdate.push(item.id);
                }
            }

            // Fetch product quantities to ensure stock
            if(productIdsToUpdate.length > 0) {
                const productsRef = collection(firestore, 'users', user.uid, 'products');
                const q = query(productsRef, where('__name__', 'in', productIdsToUpdate));
                const productSnapshots = await getDocs(q);
                const stockLevels: Record<string, number> = {};
                productSnapshots.forEach(doc => {
                    stockLevels[doc.id] = doc.data().quantity;
                });
                
                // Only iterate over items that are actual products
                for(const item of activeCart.items.filter(i => !i.id.startsWith('custom-'))) {
                    if (stockLevels[item.id] < item.cartQuantity) {
                       throw new Error(`Stock insuffisant pour ${item.name}. Disponible : ${stockLevels[item.id]}`);
                    }
                    const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                    const newQuantity = stockLevels[item.id] - item.cartQuantity;
                    batch.update(productRef, { quantity: newQuantity });
                }
            }

            const saleData: Sale = {
                id: saleId,
                invoiceNumber: `INV-${Date.now()}`,
                items: saleItemsForDb,
                subtotal,
                discountType: activeCart.discountType,
                discountAmount: activeCart.discountValue,
                total,
                amountPaid: amountPaidNum,
                remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
                paymentStatus: finalPaymentStatus,
                customerId: activeCart.customerId,
                customerName: activeCart.customerName,
                createdAt: serverTimestamp(),
            };
            batch.set(saleRef, saleData);
            
            await batch.commit();

            toast.success("Vente enregistrée avec succès !");
            setCompletedSale(saleData);
            setCompletedSaleCustomer(customers?.find(c => c.id === activeCart.customerId) || null);
            setIsPaymentDialogOpen(false);
            
            // Reset cart
            const newCarts = carts.filter(c => c.id !== activeCartId);
            if (newCarts.length === 0) {
                 const newId = addNewCart();
                 setActiveCartId(newId);
            } else {
                 setCarts(newCarts);
                 setActiveCartId(newCarts[0].id);
            }

        } catch (error: any) {
            console.error("Erreur lors de la finalisation de la vente:", error);
            toast.error(error.message || "Une erreur est survenue lors de la sauvegarde de la vente.");
        } finally {
            setIsSavingSale(false);
        }
    };
    
    const handleClearCart = () => {
        if (!activeCart) return;
        updateCart({ ...activeCart, items: [] });
        toast.info("Le panier a été vidé.");
        setIsClearCartDialogOpen(false);
    };

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingCompany;

    if (isLoading || !isClient || !user || !activeCart) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'interface de vente...</p></div>;
    }


    return (
        <>
            <AddCustomerDialog
                isOpen={isAddCustomerOpen}
                onOpenChange={setIsAddCustomerOpen}
                userId={user!.uid}
                onCustomerAdded={(newCustomer) => {
                    if (activeCart) {
                        updateCart({
                            ...activeCart,
                            customerId: newCustomer.id,
                            customerName: `${newCustomer.firstName} ${newCustomer.lastName}`
                        });
                    }
                }}
            />
             <AddCustomProductDialog 
                isOpen={isCustomProductDialogOpen}
                onOpenChange={setIsCustomProductDialogOpen}
                onConfirm={addCustomProductToCart}
            />
            {completedSale && (
                <SaleCompleteDialog
                    isOpen={!!completedSale}
                    onOpenChange={() => setCompletedSale(null)}
                    sale={completedSale}
                    customer={completedSaleCustomer}
                    companyProfile={companyProfile}
                />
            )}
             <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finaliser la vente</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className="text-center py-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total à payer</p>
                            <p className="text-4xl font-bold">{total.toFixed(1)} DA</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount-paid">Montant Payé (DA)</Label>
                            <Input
                                id="amount-paid"
                                type="number"
                                autoFocus
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => e.key === 'Enter' && handleFinalizeSale()}
                            />
                        </div>
                        <div className="text-sm text-center">
                            {parseFloat(amountPaid) >= total ? (
                                <p>Reste à rendre: <span className="font-bold text-green-500">{(parseFloat(amountPaid) - total).toFixed(1)} DA</span></p>
                            ) : (
                                <p>Solde restant dû: <span className="font-bold text-destructive">{(total - (parseFloat(amountPaid) || 0)).toFixed(1)} DA</span></p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSavingSale}>Annuler</Button>
                        <Button onClick={handleFinalizeSale} disabled={isSavingSale}>
                            {isSavingSale ? "Enregistrement..." : "Confirmer la vente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isClearCartDialogOpen} onOpenChange={setIsClearCartDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Tous les articles du panier actuel ({activeCart.items.length} articles) seront supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Vider</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <main className="flex flex-col h-full max-h-[calc(100vh-theme(space.14))]">
                <Tabs value={activeCartId} onValueChange={handleTabChange} className="flex flex-col h-full">
                    <div className="p-2 border-b">
                        <TabsList className="h-auto">
                            {carts.map(cart => (
                                <TabsTrigger key={cart.id} value={cart.id} className="relative pr-8">
                                    {cart.name}
                                    <button onClick={(e) => handleRemoveTab(e, cart.id)} className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted-foreground/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                </TabsTrigger>
                            ))}
                            <Button variant="ghost" size="icon" onClick={handleAddTab}><PlusCircle className="h-5 w-5" /></Button>
                        </TabsList>
                    </div>

                    {carts.map(cart => (
                        <TabsContent key={cart.id} value={cart.id} className="flex-grow m-0 data-[state=inactive]:hidden">
                            <div className="grid lg:grid-cols-2 h-full max-h-[calc(100vh-theme(space.14)-theme(space.16))]">
                                <div className="lg:border-r flex flex-col p-4 gap-4">
                                     <Card>
                                        <CardHeader className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User className="h-5 w-5 text-primary"/>
                                                <CardTitle className="text-lg">Client</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 flex gap-2">
                                            <div className="flex-grow">
                                                <Combobox
                                                    options={customerOptions}
                                                    onSelect={handleCustomerSelect}
                                                    value={cart.customerId || 'walk-in'}
                                                    placeholder={cart.customerName}
                                                    searchPlaceholder="Rechercher un client..."
                                                    notFoundMessage="Aucun client trouvé."
                                                />
                                            </div>
                                            <Button variant="outline" onClick={() => setIsAddCustomerOpen(true)}>
                                                <PlusCircle className="mr-2 h-4 w-4" />Nouveau
                                            </Button>
                                        </CardContent>
                                    </Card>
                                     <div className="grid grid-cols-1 gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Rechercher un produit par nom..." className="pl-9" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Tapez le nom d'un produit..." />
                                                    <CommandList>
                                                        <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                                                        <CommandGroup>
                                                            {products?.map(p => (
                                                                <CommandItem key={p.id} onSelect={() => addProductToCart(p)} disabled={p.quantity <= 0}>
                                                                    <div className="flex justify-between w-full">
                                                                        <span>{p.name}</span>
                                                                        <span className={cn("text-xs", p.quantity <= p.minStockLevel ? "text-destructive" : "text-muted-foreground")}>
                                                                            Stock: {p.quantity}
                                                                        </span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow">
                                                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input ref={barcodeInputRef} placeholder="Scanner un code-barres (Ctrl+I)" onKeyDown={handleBarcodeScan} className="pl-9" />
                                            </div>
                                            <Button variant="outline" onClick={() => setIsCustomProductDialogOpen(true)}>
                                                <FilePlus2 className="mr-2 h-4 w-4" />
                                                Article
                                            </Button>
                                        </div>
                                    </div>
                                    <Card className="flex-grow flex flex-col">
                                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                                            <CardTitle className="text-lg">Panier ({cart.items.length})</CardTitle>
                                            {cart.items.length > 0 && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setIsClearCartDialogOpen(true)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Vider le panier</span>
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent className="p-0 flex-grow">
                                            <ScrollArea className="h-[calc(100vh-28rem)]">
                                                {cart.items.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-muted-foreground">Le panier est vide</div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Produit</TableHead>
                                                                <TableHead className="w-[120px]">Quantité</TableHead>
                                                                <TableHead className="text-right">Total</TableHead>
                                                                <TableHead className="w-[50px]"><span className="sr-only">Supprimer</span></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {cart.items.map(item => (
                                                                <TableRow key={item.id}>
                                                                    <TableCell>
                                                                        <div className="font-medium">{item.name}</div>
                                                                        <div className="text-xs text-muted-foreground">{item.price.toFixed(1)} DA</div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.id, item.cartQuantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                                            <Input type="number" value={item.cartQuantity} onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))} className="h-7 w-12 text-center" />
                                                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(item.id, item.cartQuantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-semibold">{(item.price * item.cartQuantity).toFixed(1)} DA</TableCell>
                                                                    <TableCell>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateItemQuantity(item.id, 0)}><Trash2 className="h-4 w-4" /></Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="bg-muted/40 p-4 flex flex-col gap-4">
                                     <Card>
                                        <CardHeader>
                                            <CardTitle>Résumé</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                 <div className="flex justify-between text-lg">
                                                    <span>Sous-total</span>
                                                    <span>{subtotal.toFixed(1)} DA</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1">
                                                        <Button size="sm" variant={cart.discountType === 'fixed' ? 'default' : 'ghost'} onClick={() => handleDiscountTypeChange('fixed')}>Remise (DA)</Button>
                                                        <Button size="sm" variant={cart.discountType === 'percentage' ? 'default' : 'ghost'} onClick={() => handleDiscountTypeChange('percentage')}>Remise (%)</Button>
                                                    </div>
                                                    <Input type="number" value={cart.discountValue} onChange={handleDiscountValueChange} className="w-24 h-9" />
                                                </div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Total Remise</span>
                                                    <span>- {discount.toFixed(1)} DA</span>
                                                </div>
                                            </div>
                                            <div className="border-t pt-4 mt-4">
                                                 <div className="flex justify-between text-3xl font-bold text-primary">
                                                    <span>TOTAL</span>
                                                    <span>{total.toFixed(1)} DA</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                     <div className="mt-auto">
                                        <DialogTrigger asChild>
                                            <Button 
                                                className="w-full text-lg py-7" 
                                                disabled={cart.items.length === 0}
                                                onClick={() => {
                                                    setAmountPaid(total.toFixed(1));
                                                    setIsPaymentDialogOpen(true);
                                                }}
                                            >
                                                <CheckCircle className="mr-2 h-5 w-5" /> Finaliser la vente
                                            </Button>
                                        </DialogTrigger>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </main>
        </>
    );
}

    