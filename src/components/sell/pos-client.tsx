'use client';

import type { Product, Sale, Customer, SaleLineItem, InvoiceCounter } from '@/lib/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { PlusCircle, MinusCircle, XCircle, Coins, BookUser, User, Search, ScanLine, Barcode as BarcodeIcon, ChevronsUpDown } from 'lucide-react';
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
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, increment, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { BarcodeScanner } from '@/components/sell/barcode-scanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';


interface CartItem extends Product {
  cartQuantity: number;
}

function CustomerSelect({ customers, selectedCustomerId, onSelect }: { customers: Customer[], selectedCustomerId: string | undefined, onSelect: (customerId: string | undefined) => void }) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const filteredCustomers = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedCustomer
                            ? selectedCustomer.name
                            : "Sélectionner un client"}
                    </div>
                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder="Rechercher un client..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                        <CommandGroup>
                            {filteredCustomers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                        onSelect(customer.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {customer.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const generalCustomer: Customer = {
    id: 'general',
    name: 'Client Général',
    phone: 'N/A'
};

export function POSClient({ products, customers }: { products: Product[], customers: Customer[] }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(generalCustomer.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeTerm, setBarcodeTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const allCustomers = useMemo(() => [generalCustomer, ...customers], [customers]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomerId(generalCustomer.id);
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
    if (!user || cart.length === 0 || !selectedCustomerId || isCheckingOut) {
        if (!selectedCustomerId) {
             toast({
                variant: "destructive",
                title: "Aucun client sélectionné",
                description: "Veuillez sélectionner un client pour finaliser la vente.",
            });
        }
        return;
    };
    
    if (paymentMethod === 'credit' && selectedCustomerId === 'general') {
        toast({
            variant: "destructive",
            title: "Paiement à crédit non autorisé",
            description: "Le client général ne peut pas effectuer d'achats à crédit. Veuillez sélectionner un client enregistré.",
        });
        return;
    }
    
    setIsCheckingOut(true);

    try {
        await runTransaction(firestore, async (transaction) => {
            const counterRef = doc(firestore, 'counters', 'sales');
            const counterDoc = await transaction.get(counterRef);

            let newInvoiceNumber = 1;
            if (counterDoc.exists()) {
                newInvoiceNumber = counterDoc.data().lastNumber + 1;
            }

            const customerId = selectedCustomerId;
            const salesRef = collection(firestore, `customers/${customerId}/sales`);
            const saleId = `sale_${Date.now()}`;
            const saleDocRef = doc(salesRef, saleId);
            
            const lineItemIds = [];
        
            const lineItemsRef = collection(firestore, 'sales_line_items');
            for (const item of cart) {
                const lineItemId = `sli_${Date.now()}_${item.id}`;
                lineItemIds.push(lineItemId);
        
                const lineItemDocRef = doc(lineItemsRef, lineItemId);
                const lineItemData: Omit<SaleLineItem, 'id'> = {
                    productId: item.id,
                    quantity: item.cartQuantity,
                    unitPrice: item.price,
                    discount: 0,
                };
                transaction.set(lineItemDocRef, lineItemData);
        
                // Decrement product stock
                const productRef = doc(firestore, `suppliers/${item.supplierId}/products/${item.id}`);
                transaction.update(productRef, { quantity: increment(-item.cartQuantity) });
            }
        
            const saleData: Omit<Sale, 'id'> = {
                invoiceNumber: newInvoiceNumber,
                customerId,
                saleDate: new Date().toISOString(),
                totalAmount: total,
                paymentMethod: paymentMethod as 'cash' | 'credit',
                saleLineItemIds: lineItemIds
            };
            transaction.set(saleDocRef, saleData);
        
            if (paymentMethod === 'credit') {
                const customerRef = doc(firestore, 'customers', customerId);
                transaction.update(customerRef, { debt: increment(total) });
            }
            
            // Update the counter
            transaction.set(counterRef, { lastNumber: newInvoiceNumber }, { merge: true });
        });

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
            description: "Une erreur est survenue lors du traitement de la vente. Veuillez réessayer.",
        });
    } finally {
        setIsCheckingOut(false);
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
      if (isScannerOpen) setIsScannerOpen(false);
      if (barcodeTerm) setBarcodeTerm('');
    } else {
      toast({
        variant: "destructive",
        title: "Produit Non Trouvé",
        description: `Aucun produit ne correspond au code-barres : ${barcode}`,
      });
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (barcodeTerm) {
      handleBarcodeScan(barcodeTerm);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher par nom de produit..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex w-full items-center gap-2">
                  <form onSubmit={handleBarcodeSubmit} className="relative w-full">
                    <BarcodeIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Entrer le code-barres..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={barcodeTerm}
                      onChange={(e) => setBarcodeTerm(e.target.value)}
                    />
                  </form>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsScannerOpen(true)}>
                    <ScanLine className="h-5 w-5" />
                    <span className="sr-only">Scanner un code-barres</span>
                  </Button>
                </div>
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
                       <CustomerSelect
                          customers={allCustomers}
                          selectedCustomerId={selectedCustomerId}
                          onSelect={setSelectedCustomerId}
                       />
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
                          <ToggleGroupItem value="credit" aria-label="بالدين" className="flex-1" disabled={selectedCustomerId === 'general'}>
                              <BookUser className="h-4 w-4 mr-2"/> بالدين
                          </ToggleGroupItem>
                      </ToggleGroup>
                  </div>
                </div>
              <Button size="lg" className="w-full rounded-t-none rounded-b-lg text-lg" disabled={cart.length === 0 || !selectedCustomerId || isCheckingOut} onClick={handleCheckout}>
                  {isCheckingOut ? 'Traitement...' : 'Payer'}
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
