
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { MinusCircle, PlusCircle, User, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import Link from 'next/link';
import type { Product, Customer } from '@/lib/types';

interface CartItem extends Product {
    cartQuantity: number;
}


export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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

  const showStatusMessage = useCallback((type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);
  
  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
        showStatusMessage('error', `Stock épuisé pour ${product.name}.`);
        return;
    }
    setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        if (existingItem) {
            if (existingItem.cartQuantity >= product.quantity) {
                showStatusMessage('error', `Quantité maximale atteinte pour ${product.name}.`);
                return prevCart;
            }
            return prevCart.map((item) =>
                item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
            );
        }
        showStatusMessage('success', `${product.name} ajouté.`);
        return [...prevCart, { ...product, cartQuantity: 1 }];
    });
  }, [showStatusMessage]);

  const decreaseQuantity = (productId: string) => {
      setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.id === productId);
          if (existingItem && existingItem.cartQuantity > 1) {
              return prevCart.map((item) =>
                  item.id === productId ? { ...item, cartQuantity: item.cartQuantity - 1 } : item
              );
          }
          return prevCart.filter((item) => item.id !== productId);
      });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };


  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  }, [cart]);

  const handleProcessSale = (amountPaid: number) => {
    if (!firestore || !user || cart.length === 0) return;
    
    setIsProcessingSale(true);
    setStatusMessage(null);

    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);
    const remainingBalance = total - amountPaid;
    const paymentStatus = remainingBalance <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid');
    const invoiceNumber = `F-${Date.now()}`;

    const saleData: any = {
        invoiceNumber: invoiceNumber,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.cartQuantity })),
        total: total,
        amountPaid: amountPaid,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paymentStatus: paymentStatus,
        createdAt: serverTimestamp(),
    };

    if (selectedCustomer) {
        saleData.customerId = selectedCustomer.id;
        saleData.customerName = `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
    }

    const batch = writeBatch(firestore);

    const salesCollectionRef = collection(firestore, 'users', user.uid, 'sales');
    const newSaleRef = doc(salesCollectionRef);
    batch.set(newSaleRef, saleData);

    for (const item of cart) {
        const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
        const newQuantity = item.quantity - item.cartQuantity;
        batch.update(productRef, { quantity: newQuantity });
    }

    batch.commit()
      .then(() => {
            setCart([]);
            setSelectedCustomerId('none');
            setIsProcessingSale(false);
            showStatusMessage('success', `Vente enregistrée avec succès (Facture ${invoiceNumber})`);
            setIsPaymentDialogOpen(false);
      })
      .catch((err) => {
            console.error("Erreur lors de la vente :", err);
            setIsProcessingSale(false);
            showStatusMessage('error', "Échec de l'enregistrement de la vente.");
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
                 showStatusMessage('error', "Produit non trouvé.");
            }
        }
    }, [barcodeSearch, products, addToCart, showStatusMessage]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);


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
        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            total={total}
            isProcessing={isProcessingSale}
            onConfirm={handleProcessSale}
        />
        <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 h-full overflow-hidden">
            <div className="flex flex-col gap-4 md:col-span-1 lg:col-span-2 h-full overflow-hidden">
                <Card className='flex flex-col h-full'>
                    <CardHeader>
                        <CardTitle>Produits</CardTitle>
                        <CardDescription>
                            Scannez un code-barres, recherchez un produit par nom, ou cliquez pour l'ajouter au panier.
                        </CardDescription>
                         <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                             <Input 
                                placeholder="Rechercher par nom..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full"
                            />
                            <Input 
                                placeholder="Scanner ou taper le code-barres..."
                                value={barcodeSearch}
                                onChange={(e) => setBarcodeSearch(e.target.value)}
                                className="w-full"
                                autoFocus
                            />
                        </div>
                        <div className="h-5 pt-1">
                            {statusMessage && (
                                <p className={`text-xs ${statusMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
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
                        <CardTitle>Vente en cours</CardTitle>
                        <div className="grid w-full items-center gap-1.5 pt-4">
                            <Label htmlFor="customer-select">Associer à un client</Label>
                             <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId} disabled={isLoadingCustomers || !customers?.length}>
                                <SelectTrigger id="customer-select" className="w-full">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Sélectionner un client..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun client (Vente au comptoir)</SelectItem>
                                    {customers?.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
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
                    <CardContent className="flex-1 overflow-auto">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                {statusMessage?.type === 'success' && !isProcessingSale ? (
                                    <p className="text-green-500">{statusMessage.text}</p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Le panier est vide.
                                    </p>
                                )}
                            </div>
                        ) : (
                           <div className="space-y-2">
                               {cart.map((item) => (
                                   <div key={item.id} className="flex items-center justify-between">
                                       <div>
                                           <p className="font-medium">{item.name}</p>
                                           <p className="text-sm text-muted-foreground">{item.cartQuantity} x {item.price.toFixed(2)} DA</p>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           <span className="font-semibold">{(item.cartQuantity * item.price).toFixed(2)} DA</span>
                                           <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addToCart(item)}><PlusCircle className="h-4 w-4" /></Button>
                                           <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => decreaseQuantity(item.id)}><MinusCircle className="h-4 w-4" /></Button>
                                           <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><XCircle className="h-4 w-4" /></Button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 mt-auto pt-4 border-t">
                         <div className="flex w-full justify-between font-semibold">
                            <span>Total</span>
                            <span>{total.toFixed(2)} DA</span>
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={cart.length === 0 || isProcessingSale}
                            onClick={() => setIsPaymentDialogOpen(true)}
                        >
                            {isProcessingSale ? 'Encaissement...' : 'Encaisser'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    </>
  );
}
