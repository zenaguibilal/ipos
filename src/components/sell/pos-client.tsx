'use client';

import type { Product, Sale, Customer } from '@/lib/types';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlusCircle, MinusCircle, XCircle, Coins, BookUser, User, Search, ScanLine } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '../ui/label';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFirestore, useUser, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { BarcodeScanner } from '@/components/sell/barcode-scanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';


interface CartItem extends Product {
  cartQuantity: number;
}

export function POSClient({ products, customers }: { products: Product[], customers: Customer[] }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(customers[0]?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);


  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.cartQuantity < product.quantity) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          );
        } else {
            toast({
                variant: "destructive",
                title: "En rupture de stock",
                description: `Plus de ${product.name} en stock.`,
            });
            return prevCart;
        }
      }
      if (product.quantity > 0) {
        return [...prevCart, { ...product, cartQuantity: 1 }];
      }
      toast({
            variant: "destructive",
            title: "En rupture de stock",
            description: `${product.name} est en rupture de stock.`,
      });
      return prevCart;

    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
        const itemToUpdate = prevCart.find(item => item.id === productId);
        if (!itemToUpdate) return prevCart;
        
        if (newQuantity <= 0) {
          return prevCart.filter((item) => item.id !== productId);
        }

        if (newQuantity > itemToUpdate.quantity) {
             toast({
                variant: "destructive",
                title: "Quantité non disponible",
                description: `Seulement ${itemToUpdate.quantity} unités de ${itemToUpdate.name} sont disponibles.`,
            });
            return prevCart;
        }

        return prevCart.map((item) =>
            item.id === productId ? { ...item, cartQuantity: newQuantity } : item
        );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
  const total = subtotal;

  const handleCheckout = async () => {
    if (!user || cart.length === 0 || !selectedCustomerId) {
        if (!selectedCustomerId) {
             toast({
                variant: "destructive",
                title: "Aucun client sélectionné",
                description: "Veuillez sélectionner un client pour finaliser la vente.",
            });
        }
        return;
    };

    const batch = writeBatch(firestore);

    const customerId = selectedCustomerId;

    const salesRef = collection(firestore, `customers/${customerId}/sales`);
    const saleId = doc(collection(firestore, 'id_generator')).id;
    const saleDocRef = doc(salesRef, saleId);

    const saleData: Omit<Sale, 'id' | 'customer'> = {
        customerId,
        saleDate: new Date().toISOString(),
        totalAmount: total,
        paymentMethod: paymentMethod as 'cash' | 'credit',
        saleLineItemIds: cart.map(item => item.id)
    };
    batch.set(saleDocRef, saleData);

    const lineItemsRef = collection(firestore, 'sales_line_items');
    cart.forEach(item => {
        const lineItemId = doc(collection(firestore, 'id_generator')).id;
        const lineItemDocRef = doc(lineItemsRef, lineItemId);
        batch.set(lineItemDocRef, {
            productId: item.id,
            quantity: item.cartQuantity,
            unitPrice: item.price,
            discount: 0,
        });

        // Decrement product stock
        const productRef = doc(firestore, `suppliers/${item.supplierId}/products/${item.id}`);
        batch.update(productRef, { quantity: item.quantity - item.cartQuantity });
    });

    try {
        await batch.commit();
        toast({
            title: "Vente Terminée!",
            description: "La transaction a été enregistrée.",
        });
        setCart([]); // Clear cart
    } catch (error) {
        console.error("Erreur de paiement: ", error);
        toast({
            variant: "destructive",
            title: "Le Paiement a Échoué",
            description: "Une erreur est survenue lors du traitement de la vente.",
        });
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode); 
    if (product) {
      addToCart(product);
      toast({
        title: "Produit Ajouté",
        description: `${product.name} a été ajouté au panier.`,
      });
      setIsScannerOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Produit Non Trouvé",
        description: `Aucun produit ne correspond au code-barres : ${barcode}`,
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        {/* Product Selection */}
        <div className="md:col-span-2 bg-card rounded-lg border flex flex-col">
          <CardHeader>
              <CardTitle>Produits</CardTitle>
              <div className="flex w-full items-center gap-2 pt-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher des produits..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsScannerOpen(true)}>
                  <ScanLine className="h-5 w-5" />
                  <span className="sr-only">Scanner un code-barres</span>
                </Button>
              </div>
          </CardHeader>
          <div className="p-4 flex-grow overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                  <Card
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                  <CardContent className="p-2 flex flex-col items-center justify-center">
                      <Image
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/150/150`}
                      alt={product.name}
                      width={150}
                      height={150}
                      className="aspect-square object-cover rounded-md"
                      data-ai-hint={'product photo'}
                      />
                      <h3 className="font-semibold text-sm mt-2 text-center">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">
                      {(product.price / 100).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'DZD',
                          minimumFractionDigits: 0
                      })}
                      </p>
                  </CardContent>
                  </Card>
              ))}
              </div>
          </div>
        </div>

        {/* Cart and Checkout */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Panier</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center">Votre panier est vide.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <Image
                        src={item.imageUrl || `https://picsum.photos/seed/${item.id}/48/48`}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="rounded-md"
                        data-ai-hint={'product photo'}
                      />
                      <div className="flex-grow">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(item.price / 100).toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'DZD',
                            minimumFractionDigits: 0
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                          <span>{item.cartQuantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><XCircle className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col !items-stretch !p-0 border-t">
                <div className="p-6 space-y-4">
                  <div>
                      <Label className="mb-2 block">Client</Label>
                      <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                          <SelectTrigger>
                              <User className="mr-2 h-4 w-4" />
                              <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                          <SelectContent>
                              {customers.map(customer => (
                                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                      <span>Sous-total</span>
                      <span>{(subtotal / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{(total / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="pt-4">
                      <Label className="mb-2 block">Moyen de Paiement</Label>
                      <ToggleGroup type="single" defaultValue={paymentMethod} onValueChange={(value) => value && setPaymentMethod(value)} variant="outline" className="w-full justify-between">
                          <ToggleGroupItem value="cash" aria-label="نقدا" className="flex-1">
                              <Coins className="h-4 w-4 mr-2"/> نقدا
                          </ToggleGroupItem>
                          <ToggleGroupItem value="credit" aria-label="بالدين" className="flex-1">
                              <BookUser className="h-4 w-4 mr-2"/> بالدين
                          </ToggleGroupItem>
                      </ToggleGroup>
                  </div>
                </div>
              <Button size="lg" className="w-full rounded-t-none rounded-b-lg text-lg" disabled={cart.length === 0 || !selectedCustomerId} onClick={handleCheckout}>
                  Payer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-md p-0">
          <BarcodeScanner onScan={handleBarcodeScan} onCancel={() => setIsScannerOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
