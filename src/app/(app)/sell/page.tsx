
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, writeBatch, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { MinusCircle, PlusCircle, Trash2, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
// import { Receipt } from '@/components/receipt';
import ReactDOM from 'react-dom';
import type { Product, Customer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { toast } from 'sonner';

interface CartItem extends Product {
    cartQuantity: number;
}

interface Cart {
    id: number;
    name: string;
    items: CartItem[];
    customerId?: string;
    customerName?: string;
    customerDebt?: number;
}

let cartIdCounter = 1;

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [carts, setCarts] = useState<Cart[]>([{ id: cartIdCounter++, name: `Vente ${cartIdCounter-1}`, items: [] }]);
    const [activeCartId, setActiveCartId] = useState<number>(1);
    
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    // Fetch Products
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    // Fetch Customers
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const activeCart = useMemo(() => carts.find(cart => cart.id === activeCartId), [carts, activeCartId]);

    const customerOptions: ComboboxOption[] = useMemo(() => {
        if (!customers) return [];
        return customers.map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: c.phone,
        }));
    }, [customers]);

    const handleSelectCustomer = (customerId: string) => {
        if (!activeCart) return;

        const customer = customers?.find(c => c.id === customerId);
        if (!customer) return;
        
        const updatedCarts = carts.map(cart => 
            cart.id === activeCartId 
            ? { ...cart, customerId: customer.id, customerName: `${customer.firstName} ${customer.lastName}` } 
            : cart
        );
        setCarts(updatedCarts);
    };

    const addProductToCart = useCallback((product: Product) => {
        if (!activeCart) return;

        if (product.quantity <= 0) {
            toast.warning(`Le produit "${product.name}" est en rupture de stock.`);
            return;
        }

        const existingItem = activeCart.items.find(item => item.id === product.id);

        let newItems;
        if (existingItem) {
            if (existingItem.cartQuantity >= product.quantity) {
                toast.warning(`La quantité maximale en stock pour "${product.name}" est atteinte.`);
                return;
            }
            newItems = activeCart.items.map(item =>
                item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
            );
        } else {
            newItems = [...activeCart.items, { ...product, cartQuantity: 1 }];
        }

        const updatedCarts = carts.map(cart => cart.id === activeCartId ? { ...cart, items: newItems } : cart);
        setCarts(updatedCarts);
    }, [activeCart, carts, activeCartId]);

    const updateCartItemQuantity = (productId: string, newQuantity: number) => {
        if (!activeCart) return;

        const itemToUpdate = activeCart.items.find(item => item.id === productId);
        if (!itemToUpdate) return;
        
        if (newQuantity > itemToUpdate.quantity) {
            toast.warning(`La quantité maximale en stock pour "${itemToUpdate.name}" est atteinte.`);
            newQuantity = itemToUpdate.quantity;
        }

        const newItems = newQuantity > 0
            ? activeCart.items.map(item => item.id === productId ? { ...item, cartQuantity: newQuantity } : item)
            : activeCart.items.filter(item => item.id !== productId);

        const updatedCarts = carts.map(cart => cart.id === activeCartId ? { ...cart, items: newItems } : cart);
        setCarts(updatedCarts);
    };

    const total = useMemo(() => {
        if (!activeCart) return 0;
        return activeCart.items.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
    }, [activeCart]);
    
    // const handlePrintReceipt = (cart: Cart, total: number) => {
    //     const printableContent = document.getElementById('receipt-for-print');
    //     if (printableContent) {
    //         const receiptElement = <Receipt cart={cart} total={total} />;
            
    //         // Add class to html/body to trigger correct @page rule
    //         document.documentElement.classList.add('thermal');

    //         // Use a portal to render the receipt into the dedicated div
    //         ReactDOM.createPortal(receiptElement, printableContent);

    //         // Allow images to load before printing
    //         setTimeout(() => {
    //             window.print();
    //             // Clean up class after printing
    //             document.documentElement.classList.remove('thermal');
    //             // Unmount component after printing
    //             ReactDOM.createPortal(null, printableContent);
    //         }, 300);
    //     }
    // };

    const handleFinalizeSale = async (paymentType: 'paid' | 'credit' | 'partial', amountPaid: number) => {
        if (!activeCart || !firestore || !user) return;
        if (activeCart.items.length === 0) {
            toast.error("Le panier est vide.");
            return;
        }
        if (paymentType === 'credit' && !activeCart.customerId) {
            toast.error("Veuillez sélectionner un client pour une vente à crédit.");
            return;
        }

        setIsProcessingPayment(true);
        const batch = writeBatch(firestore);

        try {
            // 1. Update product stock
            for (const item of activeCart.items) {
                const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                batch.update(productRef, { quantity: increment(-item.cartQuantity) });
            }

            // 2. Create Sale Record
            const saleRef = doc(collection(firestore, 'users', user.uid, 'sales'));
            const saleTotal = total;
            const remainingBalance = saleTotal - amountPaid;
            
            batch.set(saleRef, {
                items: activeCart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.cartQuantity })),
                total: saleTotal,
                amountPaid: amountPaid,
                remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
                paymentStatus: paymentType,
                customerId: activeCart.customerId || null,
                customerName: activeCart.customerName || 'Vente au comptoir',
                createdAt: serverTimestamp()
            });

            // 3. Update customer debt if applicable
            if (paymentType !== 'paid' && activeCart.customerId) {
                const customerRef = doc(firestore, 'users', user.uid, 'customers', activeCart.customerId);
                batch.update(customerRef, { debt: increment(remainingBalance) });
            }

            await batch.commit();

            toast.success("Vente finalisée avec succès !");

            // handlePrintReceipt(activeCart, saleTotal);

            // Reset cart or remove it
            if (carts.length > 1) {
                setCarts(carts.filter(c => c.id !== activeCartId));
                setActiveCartId(carts[0].id);
            } else {
                 setCarts([{ id: activeCart.id, name: activeCart.name, items: [] }]);
            }

        } catch (error) {
            console.error("Erreur lors de la finalisation de la vente: ", error);
            toast.error("Une erreur est survenue. La vente n'a pas été enregistrée.");
        } finally {
            setIsProcessing(false);
            setIsPaymentDialogOpen(false);
        }
    };

    const addCart = () => {
        const newCartId = cartIdCounter++;
        setCarts([...carts, { id: newCartId, name: `Vente ${newCartId}`, items: [] }]);
        setActiveCartId(newCartId);
    };

    const removeCart = (id: number) => {
        if (carts.length === 1) return; // Can't remove the last cart
        const newCarts = carts.filter(cart => cart.id !== id);
        setCarts(newCarts);
        if (activeCartId === id) {
            setActiveCartId(newCarts[0].id);
        }
    };
    
    if (isLoadingProducts || isLoadingCustomers || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des données...</p></div>
    }

    return (
        <>
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                customerName={activeCart?.customerName}
                customerDebt={activeCart?.customerDebt}
                isProcessing={isProcessing}
                onConfirm={handleFinalizeSale}
            />
            <div className="grid h-screen max-h-screen grid-cols-1 md:grid-cols-2 lg:grid-cols-5 overflow-hidden">
                {/* --- Left Column: Product Selection --- */}
                <div className="md:col-span-1 lg:col-span-3 h-full flex flex-col border-r">
                    <div className="p-4 border-b">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input placeholder="Rechercher ou scanner un produit..." className="flex-grow" />
                            <Button onClick={() => setIsAddingProduct(true)}>Ajouter un produit</Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {products?.map(product => (
                                <Card key={product.id} onClick={() => addProductToCart(product)} className={cn("cursor-pointer hover:shadow-lg transition-shadow", product.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : '')}
                                >
                                    <CardContent className="p-2 text-center">
                                        <div className="font-semibold line-clamp-2 h-10">{product.name}</div>
                                        <p className="text-lg font-bold text-primary mt-2">{product.price.toFixed(2)} DA</p>
                                        <p className={cn("text-xs", product.quantity <= product.minStockLevel ? "text-destructive" : "text-muted-foreground")}>
                                            Stock: {product.quantity}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Cart --- */}
                <div className="lg:col-span-2 h-full flex flex-col bg-card/50">
                    <div className="flex border-b overflow-x-auto">
                        {carts.map(cart => (
                            <div key={cart.id} className={cn("flex items-center p-2 border-r cursor-pointer", activeCartId === cart.id && "bg-background")}>
                                <span onClick={() => setActiveCartId(cart.id)} className="px-4 py-2 whitespace-nowrap">{cart.name}</span>
                                {carts.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCart(cart.id)}><X className="h-4 w-4" /></Button>}
                            </div>
                        ))}
                        <Button variant="ghost" onClick={addCart} className="border-l">Ajouter</Button>
                    </div>

                    {activeCart && (
                        <div className="flex-1 flex flex-col">
                            <div className="p-4 border-b">
                                <div className="flex items-center gap-4">
                                     <Combobox
                                        options={customerOptions}
                                        onSelect={handleSelectCustomer}
                                        placeholder={activeCart.customerName || "Sélectionner un client"}
                                        searchPlaceholder="Rechercher un client..."
                                        notFoundMessage="Aucun client trouvé."
                                    />
                                    <Button variant="outline" size="icon">
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {activeCart.items.length > 0 ? (
                                    <ul className="space-y-4">
                                        {activeCart.items.map(item => (
                                            <li key={item.id} className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{(item.price * item.cartQuantity).toFixed(2)} DA</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity - 1)}>
                                                        <MinusCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.cartQuantity} onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value) || 0)} className="w-16 h-8 text-center" />
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.cartQuantity + 1)}>
                                                        <PlusCircle className="h-4 w-4" />
                                                    </Button>
                                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => updateCartItemQuantity(item.id, 0)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground">Le panier est vide.</p>
                                )}
                            </div>
                            <CardFooter className="flex-col items-stretch gap-2 border-t p-4">
                                <div className="flex justify-between font-semibold text-xl">
                                    <span>Total</span>
                                    <span>{total.toFixed(2)} DA</span>
                                </div>
                                <Button size="lg" onClick={() => setIsPaymentDialogOpen(true)} disabled={activeCart.items.length === 0}>Paiement</Button>
                            </CardFooter>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
