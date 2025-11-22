
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { AddCustomProductForm } from '@/components/sell/add-custom-product-form';
import { MinusCircle, PlusCircle, User, XCircle, X, LayoutGrid, List, ShoppingCart, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import Link from 'next/link';
import type { Product, Customer, Sale, Payment, TopProduct } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox } from '@/components/ui/combobox';

type ProductWithOptionalBarcode = Product & { barcode?: string };

interface CartItem extends ProductWithOptionalBarcode {
    cartQuantity: number;
    isCustom?: boolean;
}

interface Cart {
    customerId: string;
    customerName: string;
    items: CartItem[];
}

const GUEST_CUSTOMER_ID = 'guest';

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- Data Fetching ---
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithOptionalBarcode>(productsCollectionRef);

    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);

    const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    
    const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    // --- Local State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [activeCartId, setActiveCartId] = useState<string>(GUEST_CUSTOMER_ID);
    const [carts, setCarts] = useState<Record<string, Cart>>({
        [GUEST_CUSTOMER_ID]: { customerId: GUEST_CUSTOMER_ID, customerName: 'Vente au comptoir', items: [] },
    });
     const [viewMode, setViewMode] = useState<'grid' | 'list' | 'top'>('grid');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const activeCart = carts[activeCartId];

    // --- Cart Management Functions ---
    const addProductToCart = useCallback((product: Product) => {
        if (product.quantity <= 0) {
            // Optionally, provide feedback that the product is out of stock.
            return;
        }
    
        setCarts(prevCarts => {
            const currentCart = prevCarts[activeCartId];
            if (!currentCart) return prevCarts;
    
            const existingItem = currentCart.items.find(item => item.id === product.id);
            let newItems;
    
            if (existingItem) {
                newItems = currentCart.items.map(item =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            } else {
                newItems = [...currentCart.items, { ...product, cartQuantity: 1 }];
            }
            
            return {
                ...prevCarts,
                [activeCartId]: { ...currentCart, items: newItems }
            };
        });
    }, [activeCartId]);

    // --- Memos & Derived State ---
    const customerOptions = useMemo(() => {
        if (!customers || !sales || !payments) return [];

        const salesByCustomer = sales.reduce((acc, sale) => {
            if (sale.customerId && sale.remainingBalance > 0) {
                if (!acc[sale.customerId]) acc[sale.customerId] = 0;
                acc[sale.customerId] += sale.remainingBalance;
            }
            return acc;
        }, {} as Record<string, number>);

        const paymentsByCustomer = payments.reduce((acc, payment) => {
             if (payment.customerId) {
                if (!acc[payment.customerId]) acc[payment.customerId] = 0;
                acc[payment.customerId] += payment.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        return customers.map(customer => {
            const debtFromSales = salesByCustomer[customer.id] || 0;
            const totalPayments = paymentsByCustomer[customer.id] || 0;
            const outstandingBalance = debtFromSales - totalPayments;
            
            return {
                value: customer.id,
                label: `${customer.firstName} ${customer.lastName}`,
                subLabel: outstandingBalance > 0 ? `Dette: ${outstandingBalance.toFixed(2)} DA` : undefined
            };
        });
    }, [customers, sales, payments]);


    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchQuery) return products;

        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowercasedQuery) ||
            (product.barcodes && product.barcodes.some(b => b.toLowerCase().includes(lowercasedQuery))) ||
            (product.barcode && product.barcode.toLowerCase().includes(lowercasedQuery))
        );
    }, [products, searchQuery]);

    const topSellingProducts = useMemo(() => {
        if (!sales || !products) return [];

        const productSales = sales.flatMap(s => s.items).reduce((acc, item) => {
            if (!acc[item.id]) {
                acc[item.id] = { unitsSold: 0 };
            }
            acc[item.id].unitsSold += item.quantity;
            return acc;
        }, {} as Record<string, { unitsSold: number }>);
    
        const topProductsList = Object.keys(productSales).map(productId => {
            const productInfo = products.find(p => p.id === productId);
            return {
                ...productInfo,
                id: productId,
                name: productInfo?.name || 'Produit inconnu',
                unitsSold: productSales[productId].unitsSold,
            } as TopProduct;
        }).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);

        return topProductsList;

    }, [sales, products]);


    const handleBarcodeScan = useCallback((query: string) => {
        if (!products) return;
        const scannedProduct = products.find(p => p.barcodes?.includes(query) || p.barcode === query);
        if (scannedProduct) {
            addProductToCart(scannedProduct);
            setSearchQuery(''); // Clear input after scan
        }
    }, [products, addProductToCart]);

    useEffect(() => {
        handleBarcodeScan(searchQuery);
    }, [searchQuery, handleBarcodeScan]);


    const total = useMemo(() => {
        if (!activeCart) return 0;
        return activeCart.items.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    }, [activeCart]);
    
    const updateCartItemQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity < 0) return; // Prevent negative quantity

        setCarts(prevCarts => {
            const currentCart = prevCarts[activeCartId];
            if (!currentCart) return prevCarts;

            const newItems = currentCart.items.map(item =>
                item.id === productId
                    ? { ...item, cartQuantity: newQuantity }
                    : item
            );
        
            return {
                ...prevCarts,
                [activeCartId]: { ...currentCart, items: newItems }
            };
        });
    };
    
    const removeCartItem = (productId: string) => {
        setCarts(prevCarts => {
            const currentCart = prevCarts[activeCartId];
            if (!currentCart) return prevCarts;
    
            const newItems = currentCart.items.filter(item => item.id !== productId);
            
            return {
                ...prevCarts,
                [activeCartId]: { ...currentCart, items: newItems }
            };
        });
    };

    const addCustomProductToCart = (name: string, price: number) => {
        const customProduct: CartItem = {
            id: `custom-${Date.now()}`,
            name,
            price,
            purchasePrice: 0, 
            quantity: Infinity, // Custom products don't have stock tracking
            minStockLevel: 0,
            cartQuantity: 1,
            isCustom: true,
        };
        const newItems = [...activeCart.items, customProduct];
        setCarts(prevCarts => ({
            ...prevCarts,
            [activeCartId]: { ...activeCart, items: newItems }
        }));
        setIsAddingCustomProduct(false);
    };

    const clearCart = () => {
         setCarts(prevCarts => ({
            ...prevCarts,
            [activeCartId]: { ...activeCart, items: [] }
        }));
    };


    // --- Tab / Cart Switching ---
    const selectCustomer = (customerId: string) => {
        if (!customers) return;

        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        if (!carts[customerId]) {
            setCarts(prev => ({
                ...prev,
                [customerId]: {
                    customerId: customerId,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    items: []
                }
            }));
        }
        setActiveCartId(customerId);
    };

    const addGuestTab = () => {
        const newGuestId = `guest-${Date.now()}`;
        setCarts(prev => ({
            ...prev,
            [newGuestId]: { customerId: newGuestId, customerName: 'Vente au comptoir', items: [] }
        }));
        setActiveCartId(newGuestId);
    };

    const closeTab = (cartIdToClose: string) => {
        // Prevent closing the last tab
        if (Object.keys(carts).length <= 1) return;

        // Remove the cart
        const newCarts = { ...carts };
        delete newCarts[cartIdToClose];
        setCarts(newCarts);
        
        // If the active cart was closed, switch to the first available cart
        if (activeCartId === cartIdToClose) {
            setActiveCartId(Object.keys(newCarts)[0]);
        }
    };


    // --- Payment Processing ---
    const handleFinalizeSale = async (amountPaid: number) => {
        if (!firestore || !user || !activeCart || activeCart.items.length === 0) return;
        setIsProcessingPayment(true);

        const batch = writeBatch(firestore);
        
        // 1. Decrement stock for non-custom products
        activeCart.items.forEach(item => {
            if (!item.isCustom) {
                const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                const newQuantity = item.quantity - item.cartQuantity;
                batch.update(productRef, { quantity: newQuantity });
            }
        });

        // 2. Create sale document
        const saleRef = doc(collection(firestore, 'users', user.uid, 'sales'));
        const remainingBalance = total - amountPaid;
        const paymentStatus = remainingBalance <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid');
        
        const saleData = {
            invoiceNumber: saleRef.id.substring(0, 8).toUpperCase(),
            items: activeCart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.cartQuantity })),
            total: total,
            amountPaid: amountPaid,
            remainingBalance: remainingBalance,
            paymentStatus: paymentStatus,
            customerId: activeCart.customerId !== GUEST_CUSTOMER_ID && !activeCart.customerId.startsWith('guest-') ? activeCart.customerId : null,
            customerName: activeCart.customerName,
            createdAt: serverTimestamp(),
        };
        batch.set(saleRef, saleData);

        try {
            await batch.commit();
            setIsPaymentDialogOpen(false);
            
             // Reset or close the cart
            if (activeCart.customerId.startsWith('guest') && Object.keys(carts).length > 1) {
                closeTab(activeCart.customerId);
            } else {
                clearCart();
            }

        } catch (error) {
            console.error("Failed to finalize sale: ", error);
        } finally {
            setIsProcessingPayment(false);
        }
    };


    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'interface de vente...</p></div>;
    }

    return (
        <>
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <AddCustomProductForm isOpen={isAddingCustomProduct} onOpenChange={setIsAddingCustomProduct} onConfirm={addCustomProductToCart} />
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                isProcessing={isProcessingPayment}
                onConfirm={handleFinalizeSale}
            />

            <div className="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* --- Left Column: Product Selection --- */}
                <div className="md:col-span-1 lg:col-span-2 xl:col-span-3 h-full flex flex-col border-r">
                    <div className="p-4 border-b">
                         <div className="flex flex-col sm:flex-row gap-2">
                             <Input
                                ref={searchInputRef}
                                placeholder="Scanner un code-barres ou rechercher par nom..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-grow"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsAddingProduct(true)}>Nouveau produit</Button>
                                <Button variant="outline" onClick={() => setIsAddingCustomProduct(true)}>Produit Personnalisé</Button>
                                <div className="hidden sm:flex items-center rounded-md border bg-background">
                                     <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid View">
                                        <LayoutGrid className="h-4 w-4"/>
                                    </Button>
                                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} aria-label="List View">
                                        <List className="h-4 w-4"/>
                                    </Button>
                                    <Button variant={viewMode === 'top' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('top')} aria-label="Top Selling View">
                                        <TrendingUp className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                         </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoadingProducts ? (
                            <p>Chargement des produits...</p>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts?.map(product => (
                                    <Card 
                                        key={product.id}
                                        onClick={() => addProductToCart(product)}
                                        className={cn("cursor-pointer hover:shadow-lg transition-shadow", product.quantity <= 0 && "opacity-50 cursor-not-allowed")}
                                        aria-disabled={product.quantity <= 0}
                                    >
                                        <CardContent className="p-2 aspect-square flex flex-col justify-center items-center text-center">
                                            <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.price.toFixed(2)} DA</p>
                                        </CardContent>
                                        <CardFooter className="p-2 bg-muted/50 text-center justify-center">
                                            <span className={cn("text-xs font-medium", product.quantity > 0 ? "text-primary" : "text-destructive")}>
                                                Stock: {product.quantity}
                                            </span>
                                        </CardFooter>
                                    </Card>
                                ))}
                                {filteredProducts?.length === 0 && (
                                    <p className="text-center text-muted-foreground col-span-full">Aucun produit ne correspond à votre recherche.</p>
                                )}
                            </div>
                        ) : viewMode === 'list' ? (
                             <div className="border rounded-lg overflow-hidden h-full">
                                <div className="h-full overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead>Produit</TableHead>
                                                <TableHead className="text-right">Prix</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredProducts?.map(product => (
                                                 <TableRow 
                                                    key={product.id}
                                                    onClick={() => product.quantity > 0 && addProductToCart(product)}
                                                    className={cn(
                                                        product.quantity > 0 ? "cursor-pointer" : "opacity-50 cursor-not-allowed",
                                                    )}
                                                >
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell className="text-right">{product.price.toFixed(2)} DA</TableCell>
                                                    <TableCell className="text-right">{product.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                     {filteredProducts?.length === 0 && (
                                        <div className="text-center p-4 text-muted-foreground">Aucun produit ne correspond à votre recherche.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {topSellingProducts?.map(product => (
                                    <Card 
                                        key={product.id}
                                        onClick={() => addProductToCart(product)}
                                        className={cn("cursor-pointer hover:shadow-lg transition-shadow", product.quantity <= 0 && "opacity-50 cursor-not-allowed")}
                                        aria-disabled={product.quantity <= 0}
                                    >
                                        <CardContent className="p-2 aspect-square flex flex-col justify-center items-center text-center">
                                            <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.price.toFixed(2)} DA</p>
                                        </CardContent>
                                        <CardFooter className="p-2 bg-muted/50 text-center justify-center">
                                            <span className={cn("text-xs font-medium", product.quantity > 0 ? "text-primary" : "text-destructive")}>
                                                Stock: {product.quantity}
                                            </span>
                                        </CardFooter>
                                    </Card>
                                ))}
                                {topSellingProducts?.length === 0 && (
                                     <p className="text-center text-muted-foreground col-span-full">Pas encore assez de données de vente.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Right Column: Cart --- */}
                <div className="lg:col-span-1 h-full flex flex-col bg-card">
                    <div className="p-4 border-b">
                         <Combobox
                            options={customerOptions}
                            onSelect={selectCustomer}
                            placeholder={activeCart?.customerName || "Sélectionner un client"}
                            searchPlaceholder="Rechercher un client..."
                            notFoundMessage="Aucun client trouvé."
                        />
                    </div>
                    {/* --- Tabs for Carts --- */}
                    <Tabs value={activeCartId} onValueChange={setActiveCartId} className="flex-shrink-0">
                         <TabsList className="p-1 h-auto bg-muted rounded-none justify-start overflow-x-auto">
                            {Object.values(carts).map(cart => (
                                <div key={cart.customerId} className="relative group">
                                     <TabsTrigger 
                                        value={cart.customerId} 
                                        className="h-8 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                                    >
                                        {cart.customerName}
                                    </TabsTrigger>
                                     {Object.keys(carts).length > 1 && (
                                        <button 
                                            onClick={() => closeTab(cart.customerId)} 
                                            className="absolute top-0 right-0 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={addGuestTab}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </TabsList>
                    </Tabs>
                   
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeCart && activeCart.items.length > 0 ? (
                            <ul className="space-y-4">
                                {activeCart.items.map(item => (
                                    <li key={item.id} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-1">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(item.price * item.cartQuantity).toFixed(2)} DA
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity - 1)}>
                                                <MinusCircle className="h-4 w-4" />
                                            </Button>
                                             <Input 
                                                type="number" 
                                                value={item.cartQuantity} 
                                                onChange={(e) => updateCartItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                                className="w-16 h-8 text-center"
                                                step="any"
                                            />
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity + 1)}>
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeCartItem(item.id)}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Le panier est vide.</p>
                            </div>
                        )}
                    </div>
                    
                    {activeCart && activeCart.items.length > 0 && (
                        <CardFooter className="flex-col items-stretch gap-2 border-t p-4">
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>{total.toFixed(2)} DA</span>
                            </div>
                            <Button size="lg" onClick={() => setIsPaymentDialogOpen(true)} disabled={total <= 0}>
                                Payer
                            </Button>
                            <Button variant="outline" onClick={clearCart}>
                                Vider le panier
                            </Button>
                        </CardFooter>
                    )}
                </div>
            </div>
        </>
    );
}
    

    
