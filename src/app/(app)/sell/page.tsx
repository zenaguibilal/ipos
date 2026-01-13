
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { AddProductForm } from '@/components/sell/add-product-form';
import { MinusCircle, PlusCircle, Trash2, User, UserX, X, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentDialog } from '@/components/sell/payment-dialog';
// import { Receipt } from '@/components/receipt';
import ReactDOM from 'react-dom';
import type { Product, Customer, Sale, CompanyProfile, CustomerWithSalesData, SaleItem, Payment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { SaleCompleteDialog } from '@/components/sales/sale-complete-dialog';
import { AddCustomProductForm } from '@/components/sell/add-custom-product-form';
import { ShortcutsHelpDialog } from '@/components/sell/shortcuts-help-dialog';
import { format } from 'date-fns';

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


export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [carts, setCarts] = useState<Cart[]>([{ id: 1, name: `Vente 1`, items: [] }]);
    const [activeCartId, setActiveCartId] = useState<number>(1);
    
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isSaleComplete, setIsSaleComplete] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [lastSaleCustomer, setLastSaleCustomer] = useState<CustomerWithSalesData | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');

    const searchInputRef = useCallback((node: HTMLInputElement) => {
        if (node) {
            node.focus();
        }
    }, []);

    
    // --- Data Fetching ---
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);

    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);

    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    const companyDocRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const { data: companyProfile } = useDoc<CompanyProfile>(companyDocRef);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const activeCart = useMemo(() => carts.find(cart => cart.id === activeCartId), [carts, activeCartId]);

    const customerDebts = useMemo(() => {
        if (!sales || !payments) return {};

        const salesByCustomer = sales.reduce((acc, sale) => {
            if (sale.customerId) {
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

        const debts: Record<string, number> = {};
        const allCustomerIds = new Set([...Object.keys(salesByCustomer), ...Object.keys(paymentsByCustomer)]);

        allCustomerIds.forEach(customerId => {
            const totalDebtFromSales = salesByCustomer[customerId] || 0;
            const totalPaid = paymentsByCustomer[customerId] || 0;
            const outstandingBalance = totalDebtFromSales - totalPaid;
            debts[customerId] = outstandingBalance > 0 ? outstandingBalance : 0;
        });

        return debts;
    }, [sales, payments]);

    const customerOptions: ComboboxOption[] = useMemo(() => {
        if (!customers) return [];
        return customers.map(c => {
            const debt = customerDebts[c.id] || 0;
            return {
                value: c.id,
                label: `${c.firstName} ${c.lastName}`,
                subLabel: debt > 0 ? `Dette: ${debt.toFixed(2)} DA` : undefined,
            }
        });
    }, [customers, customerDebts]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!productSearchQuery) return products;
        const lowercasedQuery = productSearchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowercasedQuery) || p.barcodes?.some(b => b.includes(lowercasedQuery)));
    }, [products, productSearchQuery]);

    const handleSelectCustomer = (customerId: string) => {
        if (!activeCart) return;

        const customer = customers?.find(c => c.id === customerId);
        if (!customer) return;

        const debt = customerDebts[customerId] || 0;
        
        const updatedCarts = carts.map(cart => 
            cart.id === activeCartId 
            ? { 
                ...cart, 
                customerId: customer.id, 
                customerName: `${customer.firstName} ${customer.lastName}`,
                customerDebt: debt
              } 
            : cart
        );
        setCarts(updatedCarts);
    };
    
    const handleRemoveCustomer = () => {
        if (!activeCart) return;
        const updatedCarts = carts.map(cart => 
            cart.id === activeCartId 
            ? { ...cart, customerId: undefined, customerName: undefined, customerDebt: undefined } 
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
        setProductSearchQuery(''); // Clear search after adding
    }, [activeCart, carts, activeCartId]);

    const addCustomProductToCart = (name: string, price: number) => {
        if (!activeCart) return;

        const customProduct: Product = {
            id: `custom-${Date.now()}`,
            name,
            price,
            purchasePrice: price, // Assume purchase price is same as selling for custom items
            quantity: 1, // virtual quantity
            minStockLevel: 0,
        };

        const newItems = [...activeCart.items, { ...customProduct, cartQuantity: 1 }];
        const updatedCarts = carts.map(cart => cart.id === activeCartId ? { ...cart, items: newItems } : cart);
        setCarts(updatedCarts);
        setIsAddingCustomProduct(false);
    };

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
    

    const handleFinalizeSale = async (amountPaid: number) => {
        if (!activeCart || !firestore || !user) return;
        if (activeCart.items.length === 0) {
            toast.error("Le panier est vide.");
            return;
        }
        
        const saleTotal = total;
        let paymentStatus: Sale['paymentStatus'] = 'paid';
        if(amountPaid < saleTotal) paymentStatus = 'partial';
        if(amountPaid === 0 && activeCart.customerId) paymentStatus = 'unpaid';

        if (paymentStatus !== 'paid' && !activeCart.customerId) {
            toast.error("Veuillez sélectionner un client pour une vente à crédit ou partielle.");
            return;
        }

        setIsProcessingPayment(true);
        const batch = writeBatch(firestore);
        
        const now = new Date();
        const saleTimestamp = serverTimestamp();
        const formattedInvoiceNumber = format(now, 'yyMMdd-HHmmss');

        try {
            // 1. Update product stock for non-custom items
            for (const item of activeCart.items) {
                if (!item.id.startsWith('custom-')) {
                    const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                    batch.update(productRef, { quantity: increment(-item.cartQuantity) });
                }
            }

            // 2. Create Sale Record
            const salesCollectionRef = collection(firestore, 'users', user.uid, 'sales');
            const saleRef = doc(salesCollectionRef); // We still generate a unique ID for the doc
            const remainingBalance = saleTotal - amountPaid;
            
            const saleData: Omit<Sale, 'id' | 'createdAt'> & { createdAt: any } = {
                invoiceNumber: formattedInvoiceNumber,
                items: activeCart.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.cartQuantity })),
                total: saleTotal,
                amountPaid: amountPaid,
                remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
                paymentStatus: paymentStatus,
                customerId: activeCart.customerId || undefined,
                customerName: activeCart.customerName || 'Vente au comptoir',
                createdAt: saleTimestamp
            };
            batch.set(saleRef, saleData);


            await batch.commit();

            const finalSaleRecord: Sale = {
                ...saleData,
                id: saleRef.id,
                createdAt: new Date() // Use current date for the dialog
            }

            setLastSale(finalSaleRecord);
            if (activeCart.customerId) {
                const customerData = customers?.find(c => c.id === activeCart.customerId);
                // This is a simplified version. A real app would recalculate the full debt.
                setLastSaleCustomer(customerData ? { ...customerData, totalSpent: 0, outstandingBalance: remainingBalance } : null);
            } else {
                setLastSaleCustomer(null);
            }

            toast.success("Vente finalisée avec succès !");
            setIsSaleComplete(true);

            // Reset cart or remove it
            if (carts.length > 1) {
                const newCarts = carts.filter(c => c.id !== activeCartId);
                const renumberedCarts = newCarts.map((cart, index) => ({
                    ...cart,
                    name: `Vente ${index + 1}`
                }));
                setCarts(renumberedCarts);
                setActiveCartId(renumberedCarts[0].id);
            } else {
                // Keep a single cart but reset it
                setCarts([{ id: activeCartId, name: `Vente 1`, items: [] }]);
            }

        } catch (error) {
            console.error("Erreur lors de la finalisation de la vente: ", error);
            toast.error("Une erreur est survenue. La vente n'a pas été enregistrée.");
        } finally {
            setIsProcessingPayment(false);
            setIsPaymentDialogOpen(false);
        }
    };
    
    const addCart = () => {
       const newCartId = carts.length > 0 ? Math.max(...carts.map(c => c.id)) + 1 : 1;
        const newCartName = `Vente ${carts.length + 1}`;
        setCarts([...carts, { id: newCartId, name: newCartName, items: [] }]);
        setActiveCartId(newCartId);
    };

    const removeCart = (id: number) => {
        if (carts.length === 1) return; // Can't remove the last cart
        
        let newActiveCartId = activeCartId;
        const removedCartIndex = carts.findIndex(cart => cart.id === id);
        
        const newCarts = carts.filter(cart => cart.id !== id);

        // If the active cart is the one being removed, switch to the previous one or the first one
        if (activeCartId === id) {
             if (removedCartIndex > 0) {
                newActiveCartId = carts[removedCartIndex - 1].id;
             } else {
                newActiveCartId = newCarts[0].id;
             }
        }
        
        // Rename carts to be sequential
        const renumberedCarts = newCarts.map((cart, index) => ({
            ...cart,
            name: `Vente ${index + 1}`
        }));
        
        setCarts(renumberedCarts);
        setActiveCartId(newActiveCartId);
    };

    const clearCart = () => {
        if (!activeCart) return;
        const updatedCarts = carts.map(cart => 
            cart.id === activeCartId 
            ? { ...cart, items: [], customerId: undefined, customerName: undefined, customerDebt: undefined } 
            : cart
        );
        setCarts(updatedCarts);
        toast.info("Le panier a été vidé.");
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                setIsHelpOpen(true);
            }
            if (e.key === 'F2') {
                e.preventDefault();
                const searchInput = document.getElementById('product-search') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
            if (e.key === 'F4') {
                e.preventDefault();
                if (activeCart && activeCart.items.length > 0) {
                    setIsPaymentDialogOpen(true);
                }
            }
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setIsAddingProduct(true);
            }
             if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsAddingCustomProduct(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeCart]);
    
    const isLoading = isLoadingProducts || isLoadingCustomers || isUserLoading || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des données...</p></div>;
    }

    return (
        <>
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <AddCustomProductForm isOpen={isAddingCustomProduct} onOpenChange={setIsAddingCustomProduct} onConfirm={addCustomProductToCart} />
            <ShortcutsHelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                isProcessing={isProcessingPayment}
                onConfirm={handleFinalizeSale}
            />
             {lastSale && (
                <SaleCompleteDialog
                    isOpen={isSaleComplete}
                    onOpenChange={setIsSaleComplete}
                    sale={lastSale}
                    customer={lastSaleCustomer}
                    companyProfile={companyProfile}
                />
             )}
            <div className="grid h-screen max-h-screen grid-cols-1 md:grid-cols-2 lg:grid-cols-5 overflow-hidden">
                {/* --- Left Column: Product Selection --- */}
                <div className="md:col-span-1 lg:col-span-3 h-full flex flex-col border-r bg-card/20">
                    <div className="p-4 border-b">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                id="product-search"
                                placeholder="Rechercher ou scanner un produit... (F2)"
                                className="flex-grow"
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                ref={searchInputRef}
                            />
                             <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsAddingCustomProduct(true)}>Article Personnalisé (Alt+A)</Button>
                                <Button onClick={() => setIsAddingProduct(true)}>Nouveau Produit (Alt+N)</Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                       {filteredProducts.length > 0 ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <Card 
                                    key={product.id} 
                                    onClick={() => addProductToCart(product)} 
                                    className={cn(
                                        "cursor-pointer hover:shadow-lg transition-shadow bg-card hover:bg-card/90",
                                        product.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    )}
                                    title={product.name}
                                >
                                    <CardContent className="p-2 text-center flex flex-col justify-between h-full">
                                        <div className="font-semibold line-clamp-2 h-10 mb-2">{product.name}</div>
                                        <div>
                                            <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} DA</p>
                                            <p className={cn("text-xs", product.quantity <= product.minStockLevel ? "text-destructive font-bold" : "text-muted-foreground")}>
                                                Stock: {product.quantity}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                       ) : (
                           <div className="text-center text-muted-foreground pt-10">
                                {products && products.length > 0 ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit dans l\\'inventaire.'}
                           </div>
                       )}
                    </div>
                     <div className="p-2 border-t text-center text-xs text-muted-foreground">
                        Appuyez sur <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">F1</kbd> pour les raccourcis.
                    </div>
                </div>

                {/* --- Right Column: Cart --- */}
                 <div className="lg:col-span-2 h-full flex flex-col bg-background">
                    <div className="flex border-b overflow-x-auto">
                        {carts.map(cart => (
                            <div key={cart.id} className={cn("flex items-center p-2 border-r cursor-pointer whitespace-nowrap", activeCartId === cart.id && "bg-muted")}>
                                <span onClick={() => setActiveCartId(cart.id)} className="px-4 py-2 ">{cart.name}</span>
                                {carts.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCart(cart.id)}><X className="h-4 w-4" /></Button>}
                            </div>
                        ))}
                        <Button variant="ghost" onClick={addCart} className="border-l">Ajouter +</Button>
                    </div>

                    {activeCart ? (
                        <div className="flex-1 flex flex-col overflow-y-hidden">
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between gap-4">
                                    <Label>Client:</Label>
                                    <div className="flex-grow">
                                        <Combobox
                                            options={customerOptions}
                                            onSelect={handleSelectCustomer}
                                            value={activeCart.customerId}
                                            placeholder={activeCart.customerName || "Vente au comptoir"}
                                            searchPlaceholder="Rechercher un client..."
                                            notFoundMessage="Aucun client trouvé."
                                        />
                                    </div>
                                    {activeCart.customerId && (
                                        <Button variant="ghost" size="icon" onClick={handleRemoveCustomer}>
                                            <UserX className="h-5 w-5 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                                {activeCart.customerDebt && activeCart.customerDebt > 0 ? (
                                    <p className="text-right text-destructive text-sm mt-1">
                                        Dette précédente : {activeCart.customerDebt.toFixed(2)} DA
                                    </p>
                                ) : null}
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
                                    <p className="text-center text-muted-foreground pt-10">Le panier est vide.</p>
                                )}
                            </div>
                            <CardFooter className="flex-col items-stretch gap-2 border-t p-4">
                                <div className="flex justify-between font-semibold text-xl">
                                    <span>Total</span>
                                    <span>{total.toFixed(2)} DA</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline"
                                        onClick={clearCart}
                                        disabled={activeCart.items.length === 0 || isProcessingPayment}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Vider le panier
                                    </Button>
                                    <Button 
                                        className="flex-grow"
                                        size="lg" 
                                        onClick={() => setIsPaymentDialogOpen(true)} 
                                        disabled={activeCart.items.length === 0 || isProcessingPayment}
                                    >
                                        Procéder au paiement (F4)
                                    </Button>
                                </div>
                            </CardFooter>
                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground pt-10">Veuillez sélectionner ou créer une vente.</p>
                    )}
                </div>
            </div>
        </>
    );
    
    