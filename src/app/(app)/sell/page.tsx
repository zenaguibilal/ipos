
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { MinusCircle, PlusCircle, User, XCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import Link from 'next/link';
import type { Product, Customer } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface CartItem extends Product {
    cartQuantity: number;
}

interface Cart {
    customerId: string;
    customerName: string;
    items: CartItem[];
}

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [carts, setCarts] = useState<Record<string, Cart>>({
      'none': { customerId: 'none', customerName: 'Vente au comptoir', items: [] }
  });
  const [activeCartId, setActiveCartId] = useState<string>('none');

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ cartId: string; type: 'success' | 'error'; text: string } | null>(null);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Products collection
  const productsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'products');
  }, [firestore, user]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  
  // Customers collection
  const customersCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'customers');
  }, [user, firestore]);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // F8 to focus barcode input
            if (event.key === 'F8') {
                event.preventDefault();
                barcodeInputRef.current?.focus();
            }

            // F9 to open payment dialog
            if (event.key === 'F9') {
                event.preventDefault();
                const activeCart = carts[activeCartId];
                if (activeCart && activeCart.items.length > 0 && !isPaymentDialogOpen) {
                    setIsPaymentDialogOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [carts, activeCartId, isPaymentDialogOpen]); // Rerun if these dependencies change
  
  const showStatusMessage = useCallback((type: 'success' | 'error', text: string, cartId: string) => {
    setStatusMessage({ type, text, cartId });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);
  
  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
        showStatusMessage('error', `Stock épuisé pour ${product.name}.`, activeCartId);
        return;
    }
    setCarts(prevCarts => {
        const activeCart = prevCarts[activeCartId];
        const newItems = [...activeCart.items];
        const existingItemIndex = newItems.findIndex((item) => item.id === product.id);

        if (existingItemIndex > -1) {
            if (newItems[existingItemIndex].cartQuantity >= product.quantity) {
                showStatusMessage('error', `Quantité maximale atteinte pour ${product.name}.`, activeCartId);
                return prevCarts;
            }
            newItems[existingItemIndex] = { ...newItems[existingItemIndex], cartQuantity: newItems[existingItemIndex].cartQuantity + 1 };
        } else {
            showStatusMessage('success', `${product.name} ajouté.`, activeCartId);
            newItems.push({ ...product, cartQuantity: 1 });
        }
        
        return {
            ...prevCarts,
            [activeCartId]: { ...activeCart, items: newItems }
        };
    });
  }, [activeCartId, showStatusMessage]);

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    setCarts(prevCarts => {
        const activeCart = prevCarts[activeCartId];
        let newItems = [...activeCart.items];

        if (newQuantity <= 0) {
            newItems = newItems.filter(item => item.id !== productId);
        } else {
            const itemIndex = newItems.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                const originalProduct = products?.find(p => p.id === productId);
                if (originalProduct && newQuantity > originalProduct.quantity) {
                    showStatusMessage('error', `Stock insuffisant pour ${newItems[itemIndex].name}.`, activeCartId);
                    return prevCarts;
                }
                newItems[itemIndex] = { ...newItems[itemIndex], cartQuantity: newQuantity };
            }
        }
        
        return {
            ...prevCarts,
            [activeCartId]: { ...activeCart, items: newItems }
        };
    });
};

  const removeFromCart = (productId: string) => {
    updateCartItemQuantity(productId, 0);
  };
  
  const activeCart = carts[activeCartId];
  const total = useMemo(() => {
    if (!activeCart) return 0;
    return activeCart.items.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  }, [activeCart]);


  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'none' || !customerId || carts[customerId]) {
      return; // Do nothing if it's the placeholder or cart already exists
    }
    const customer = customers?.find(c => c.id === customerId);
    if (customer) {
        setCarts(prev => ({
            ...prev,
            [customerId]: {
                customerId,
                customerName: `${customer.firstName} ${customer.lastName}`,
                items: []
            }
        }));
        setActiveCartId(customerId);
    }
  };

  const closeCart = (e: React.MouseEvent, cartIdToClose: string) => {
    e.stopPropagation();
    if (cartIdToClose === 'none') return; // Cannot close the default cart

    setCarts(prev => {
        const newCarts = { ...prev };
        delete newCarts[cartIdToClose];
        return newCarts;
    });

    // If we closed the active cart, switch to the default one
    if (activeCartId === cartIdToClose) {
        setActiveCartId('none');
    }
  };


  const handleProcessSale = (amountPaid: number) => {
    if (!firestore || !user || !activeCart || activeCart.items.length === 0) return;
    
    setIsProcessingSale(true);
    setStatusMessage(null);

    const remainingBalance = total - amountPaid;
    const paymentStatus = remainingBalance <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid');
    const invoiceNumber = `F-${Date.now()}`;

    const saleData: any = {
        invoiceNumber: invoiceNumber,
        items: activeCart.items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.cartQuantity })),
        total: total,
        amountPaid: amountPaid,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paymentStatus: paymentStatus,
        createdAt: serverTimestamp(),
    };
    
    if (activeCart.customerId !== 'none') {
        saleData.customerId = activeCart.customerId;
        saleData.customerName = activeCart.customerName;
    }

    const batch = writeBatch(firestore);

    const salesCollectionRef = collection(firestore, 'users', user.uid, 'sales');
    const newSaleRef = doc(salesCollectionRef);
    batch.set(newSaleRef, saleData);

    for (const item of activeCart.items) {
        const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
        const newQuantity = item.quantity - item.cartQuantity;
        batch.update(productRef, { quantity: newQuantity });
    }

    batch.commit()
      .then(() => {
            const activeCartIdBeforeSale = activeCartId;
            // Reset only the active cart
            setCarts(prev => ({
                ...prev,
                [activeCartIdBeforeSale]: { ...prev[activeCartIdBeforeSale], items: [] }
            }));
            
            setIsProcessingSale(false);
            showStatusMessage('success', `Vente enregistrée (Facture ${invoiceNumber})`, activeCartIdBeforeSale);
            setIsPaymentDialogOpen(false);
      })
      .catch((err) => {
            console.error("Erreur lors de la vente :", err);
            setIsProcessingSale(false);
            showStatusMessage('error', "Échec de l'enregistrement de la vente.", activeCartId);
            setIsPaymentDialogOpen(false);
      });
  };
  
    useEffect(() => {
        if (!barcodeSearch.trim() || !products) return;

        const foundProduct = products.find(p => p.barcode === barcodeSearch.trim());
        if (foundProduct) {
            addToCart(foundProduct);
            setBarcodeSearch(''); // Clear input after successful scan
        } else {
            // Only show error if input is reasonably long, prevents errors while typing
            if (barcodeSearch.length > 3) { 
                 showStatusMessage('error', "Produit non trouvé.", activeCartId);
            }
        }
    }, [barcodeSearch, products, addToCart, showStatusMessage, activeCartId]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const showTabs = Object.keys(carts).length > 1;


  if (isUserLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
        <AddProductForm 
            isOpen={isAddingProduct}
            onOpenChange={setIsAddingProduct}
            userId={user.uid}
        />
        {activeCart && <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            total={total}
            isProcessing={isProcessingSale}
            onConfirm={handleProcessSale}
        />}
        <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 h-full overflow-hidden">
            <div className="flex flex-col gap-4 md:col-span-1 lg:col-span-2 h-full overflow-hidden">
                <Card className='flex flex-col h-full'>
                    <CardHeader>
                        <CardTitle>Produits</CardTitle>
                        <CardDescription>
                            Scannez (F8), recherchez, ou cliquez sur un produit pour l'ajouter au panier actif.
                        </CardDescription>
                         <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                             <Input 
                                placeholder="Rechercher par nom..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full"
                            />
                            <Input 
                                ref={barcodeInputRef}
                                placeholder="Scanner ou taper le code-barres (F8)..."
                                value={barcodeSearch}
                                onChange={(e) => setBarcodeSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="h-5 pt-1">
                            {statusMessage && statusMessage.cartId === activeCartId && statusMessage.type === 'error' && (
                                <p className="text-xs text-red-500">
                                    {statusMessage.text}
                                </p>
                            )}
                            {statusMessage && statusMessage.cartId === activeCartId && statusMessage.type === 'success' && !isProcessingSale && (
                                <p className="text-xs text-green-500">
                                    {statusMessage.text}
                                </p>
                             )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {isLoadingProducts ? (
                            <div className="flex h-full items-center justify-center">
                                <p>Chargement des produits...</p>
                            </div>
                        ) : filteredProducts && filteredProducts.length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredProducts.map((product) => (
                                    <Card 
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                                    >
                                        <CardHeader className="flex-1 p-4">
                                            <CardTitle className="text-sm">{product.name}</CardTitle>
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs">
                                            <span className="font-semibold">{product.price.toFixed(2)} DA</span>
                                            <span className={product.quantity <= product.minStockLevel ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                                Stock: {product.quantity}
                                            </span>
                                        </CardFooter>
                                    </Card>
                                ))}
                           </div>
                        ) : products && products.length > 0 && productSearch ? (
                             <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center rounded-md border-2 border-dashed border-border text-center">
                                <p className="text-muted-foreground">Vous n'avez aucun produit dans votre inventaire.</p>
                                <Button variant="link" onClick={() => setIsAddingProduct(true)}>Ajouter votre premier produit</Button>
                            </div>
                        )}
                    </CardContent>
                     {products && products.length > 0 && (
                        <CardFooter className="border-t pt-4">
                            <Button variant="outline" onClick={() => setIsAddingProduct(true)}>Ajouter un nouveau produit</Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
            <div className="flex flex-col gap-4 md:col-span-1 h-full">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        {!showTabs && <CardTitle>Vente en cours</CardTitle>}
                        <div className="grid w-full items-center gap-1.5 pt-4">
                            <Label htmlFor="customer-select">Ouvrir un onglet de vente pour un client</Label>
                             <Select onValueChange={handleCustomerSelect} value="">
                                <SelectTrigger id="customer-select" className="w-full" disabled={isLoadingCustomers || !customers?.length}>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Sélectionner un client..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {customers?.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id} disabled={!!carts[customer.id]}>
                                            {customer.firstName} {customer.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isLoadingCustomers && !customers?.length && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Aucun client trouvé. <Link href="/customers" className="underline">En ajouter un ?</Link>
                                </p>
                            )}
                        </div>
                    </CardHeader>

                    <Tabs value={activeCartId} onValueChange={setActiveCartId} className="flex-1 flex flex-col overflow-hidden">
                        {showTabs && (
                            <div className="px-4">
                                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(carts).length}, minmax(0, 1fr))` }}>
                                    {Object.values(carts).map(cart => (
                                        <TabsTrigger key={cart.customerId} value={cart.customerId} className="relative">
                                            {cart.customerName}
                                            {cart.customerId !== 'none' && (
                                                <div role="button" onClick={(e) => closeCart(e, cart.customerId)} className="absolute top-1 right-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                                                    <X className="h-3 w-3" />
                                                </div>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                        )}
                        
                        {Object.values(carts).map(cart => (
                             <TabsContent key={cart.customerId} value={cart.customerId} className="flex-1 flex flex-col overflow-hidden mt-0">
                                <CardContent className="flex-1 overflow-auto pt-4">
                                    {cart.items.length === 0 ? (
                                        <div className="flex h-full flex-col items-center justify-center text-center">
                                             {statusMessage?.type === 'success' && statusMessage.cartId === cart.customerId ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <p className="text-green-500 font-medium">Vente enregistrée !</p>
                                                    <p className="text-xs text-muted-foreground">{statusMessage.text}</p>
                                                </div>
                                             ) : (
                                                <p className="text-muted-foreground">Le panier est vide.</p>
                                             )}
                                        </div>
                                    ) : (
                                    <div className="space-y-2">
                                        {cart.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.cartQuantity} x {item.price.toFixed(2)} DA</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{(item.cartQuantity * item.price).toFixed(2)} DA</span>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><XCircle className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </CardContent>
                             </TabsContent>
                        ))}
                    </Tabs>

                    {activeCart && <CardFooter className="flex flex-col gap-2 mt-auto pt-4 border-t">
                            <div className="flex w-full justify-between font-semibold">
                            <span>Total</span>
                            <span>{total.toFixed(2)} DA</span>
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={activeCart.items.length === 0 || isProcessingSale}
                            onClick={() => setIsPaymentDialogOpen(true)}
                        >
                            {isProcessingSale ? 'Encaissement...' : `Encaisser (F9) pour ${activeCart?.customerName}`}
                        </Button>
                    </CardFooter>}
                </Card>
            </div>
        </main>
    </>
  );
}

    