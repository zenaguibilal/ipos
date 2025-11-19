
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { collection, serverTimestamp } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { MinusCircle, PlusCircle, User, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Product {
    id: string;
    name: string;
    price: number;
    barcode?: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
}

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleStatus, setSaleStatus] = useState<{ success?: string, error?: string } | null>(null);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('none');

  // Products collection
  const productsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'products');
  }, [firestore, user]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  
  // Sales collection
  const salesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'sales');
  }, [firestore, user]);

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
  
  const addToCart = (product: Product) => {
    setSaleStatus(null);
    setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === product.id);
        if (existingItem) {
            return prevCart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        }
        return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (productId: string) => {
      setSaleStatus(null);
      setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.id === productId);
          if (existingItem && existingItem.quantity > 1) {
              return prevCart.map((item) =>
                  item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
              );
          }
          return prevCart.filter((item) => item.id !== productId);
      });
  };

  const removeFromCart = (productId: string) => {
    setSaleStatus(null);
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };


  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleProcessSale = () => {
    if (!salesCollectionRef || cart.length === 0) return;
    
    setIsProcessingSale(true);
    setSaleStatus(null);

    const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

    const saleData: any = {
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: total,
        createdAt: serverTimestamp(),
    };

    if (selectedCustomer) {
        saleData.customerId = selectedCustomer.id;
        saleData.customerName = `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
    }

    addDocumentNonBlocking(salesCollectionRef, saleData, {
        onSuccess: () => {
            setCart([]);
            setSelectedCustomerId('none');
            setIsProcessingSale(false);
            setSaleStatus({ success: "Vente enregistrée avec succès !" });
            // The success message will be shown in the cart area
        },
        onError: (err) => {
            console.error("Erreur lors de la vente :", err);
            setIsProcessingSale(false);
            setSaleStatus({ error: "Échec de l'enregistrement de la vente." });
        }
    });
  };
  
  const handleBarcodeSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!barcodeSearch.trim() || !products) return;

    const foundProduct = products.find(p => p.barcode === barcodeSearch.trim());
    if (foundProduct) {
        addToCart(foundProduct);
        setSaleStatus({ success: `${foundProduct.name} ajouté.` });
    } else {
        setSaleStatus({ error: "Aucun produit trouvé avec ce code-barres." });
    }
    setBarcodeSearch('');
    setTimeout(() => setSaleStatus(null), 2000);
  };
  
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/40">
        <AddProductForm 
            isOpen={isAddingProduct}
            onOpenChange={setIsAddingProduct}
            userId={user.uid}
        />
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <h1 className="text-lg font-semibold md:text-xl">Point de Vente</h1>
            <Button asChild variant="outline" className="ml-auto">
                <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
        </header>
        <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-4 md:col-span-1 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Produits</CardTitle>
                        <CardDescription>
                            Cliquez sur un produit pour l'ajouter, ou effectuez une recherche.
                        </CardDescription>
                         <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                             <Input 
                                placeholder="Rechercher par nom..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full"
                            />
                            <form onSubmit={handleBarcodeSearch} className="w-full">
                                <Input 
                                    placeholder="Rechercher par code-barres..."
                                    value={barcodeSearch}
                                    onChange={(e) => setBarcodeSearch(e.target.value)}
                                />
                            </form>
                        </div>
                        <div className="h-5 pt-1">
                            {saleStatus?.error && <p className="text-xs text-red-500">{saleStatus.error}</p>}
                            {saleStatus?.success && !isProcessingSale && <p className="text-xs text-green-500">{saleStatus.success}</p>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingProducts ? (
                            <div className="flex h-64 items-center justify-center">
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
                                            {product.barcode && <CardDescription className="text-xs">{product.barcode}</CardDescription>}
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0">
                                            <p className="text-xs font-semibold">{product.price.toFixed(2)} €</p>
                                        </CardFooter>
                                    </Card>
                                ))}
                           </div>
                        ) : products && products.length > 0 && productSearch ? (
                             <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Aucun produit à afficher.</p>

                                    <Button variant="link" onClick={() => setIsAddingProduct(true)}>Ajouter un premier produit</Button>
                                </div>
                            </div>
                        )}
                         {products && products.length > 0 && (
                            <div className="mt-4 flex justify-center">
                               <Button onClick={() => setIsAddingProduct(true)}>Ajouter un nouveau produit</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col gap-4 md:col-span-1">
                <Card className="flex flex-col">
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
                                    <SelectItem value="none">Aucun client</SelectItem>
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
                    <CardContent className="flex-1">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                {saleStatus?.success && !isProcessingSale ? (
                                    <p className="text-green-500">{saleStatus.success}</p>
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
                                           <p className="text-sm text-muted-foreground">{item.quantity} x {item.price.toFixed(2)} €</p>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           <span className="font-semibold">{(item.quantity * item.price).toFixed(2)} €</span>
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
                            <span>{total.toFixed(2)} €</span>
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={cart.length === 0 || isProcessingSale}
                            onClick={handleProcessSale}
                        >
                            {isProcessingSale ? 'Encaissement...' : 'Encaisser'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    </div>
  );
}

    

    