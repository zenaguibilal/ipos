'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { collection, serverTimestamp } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';

interface Product {
    id: string;
    name: string;
    price: number;
}

interface CartItem extends Product {
    quantity: number;
}

export default function SellPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const productsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'products');
  }, [firestore, user]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  
  const salesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'sales');
  }, [firestore, user]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const addToCart = (product: Product) => {
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

  const removeFromCart = (productId: string) => {
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

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleProcessSale = () => {
    if (!salesCollectionRef || cart.length === 0) return;
    
    setIsProcessingSale(true);
    const saleData = {
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: total,
        createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(salesCollectionRef, saleData, {
        onSuccess: () => {
            setCart([]);
            setIsProcessingSale(false);
            // Optionally, show a success message
        },
        onError: (err) => {
            console.error("Erreur lors de la vente :", err);
            setIsProcessingSale(false);
            // Optionally, show an error message
        }
    });
  };


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
                        <CardDescription>Sélectionnez les produits à ajouter à la vente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingProducts ? (
                            <div className="flex h-64 items-center justify-center">
                                <p>Chargement des produits...</p>
                            </div>
                        ) : products && products.length > 0 ? (
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {products.map((product) => (
                                    <Card 
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                                    >
                                        <CardHeader className="flex-1 p-4">
                                            <CardTitle className="text-sm">{product.name}</CardTitle>
                                        </CardHeader>
                                        <CardFooter className="p-4 pt-0">
                                            <p className="text-xs font-semibold">{product.price.toFixed(2)} €</p>
                                        </CardFooter>
                                    </Card>
                                ))}
                           </div>
                        ) : (
                            <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Aucun produit à afficher.</p>
                                    <Button variant="link" onClick={() => setIsAddingProduct(true)}>Ajouter un produit</Button>
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
                    </CardHeader>
                    <CardContent className="flex-1">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                               <p className="text-muted-foreground">Le panier est vide.</p>
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
                                           <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)}>X</Button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 mt-auto">
                         <div className="flex w-full justify-between font-semibold">
                            <span>Total</span>
                            <span>{total.toFixed(2)} €</span>
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={cart.length === 0 || isProcessingSale}
                            onClick={handleProcessSale}
                        >
                            {isProcessingSale ? 'Traitement...' : 'Paiement'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </main>
    </div>
  );
}
