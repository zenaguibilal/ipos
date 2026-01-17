'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { HelpCircle } from 'lucide-react';

import { AddProductForm } from '@/components/sell/add-product-form';
import { AddCustomProductForm } from '@/components/sell/add-custom-product-form';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import { SaleCompleteDialog } from '@/components/sell/sale-complete-dialog';
import { ShortcutsHelpDialog } from '@/components/sell/shortcuts-help-dialog';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { AddPaymentForm } from '@/components/customers/add-payment-form';


import type { Product, Sale, SaleItem, CompanyProfile, Customer, Payment } from '@/lib/types';
import { ProductGrid } from '@/components/sell/product-grid';
import { CartPanel } from '@/components/sell/cart-panel';

export type ProductWithOptionalBarcode = Product & { barcode?: string };
export type CartItem = SaleItem & { cartQuantity: number };

export interface SalesSession {
    cart: CartItem[];
    customerId?: string;
    customerName?: string;
}

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data fetching
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithOptionalBarcode>(productsCollectionRef);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: allSales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: allPayments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);


    // Component state for multiple sales sessions
    const [sessions, setSessions] = useState<SalesSession[]>([{ cart: [] }]);
    const [activeSessionIndex, setActiveSessionIndex] = useState(0);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSaleComplete, setIsSaleComplete] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isProcessingSale, setIsProcessingSale] = useState(false);

    // Modal states
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [isPayingDebt, setIsPayingDebt] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    
    // Get current active session
    const activeSession = sessions[activeSessionIndex];
    const activeCustomer = useMemo(() => {
        if (!activeSession.customerId || !customers) return null;
        return customers.find(c => c.id === activeSession.customerId) || null;
    }, [activeSession.customerId, customers]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const updateCurrentSession = (updater: (session: SalesSession) => SalesSession) => {
        setSessions(currentSessions => {
            const newSessions = [...currentSessions];
            newSessions[activeSessionIndex] = updater(newSessions[activeSessionIndex]);
            return newSessions;
        });
    };


    // Cart management functions
    const addProductToCart = useCallback((product: Product | SaleItem) => {
         updateCurrentSession(session => {
            const existingItem = session.cart.find(item => item.id === product.id);
            const productInStock = products?.find(p => p.id === product.id);
            const stockQuantity = productInStock ? productInStock.quantity : Infinity;

            if (existingItem) {
                if (existingItem.cartQuantity < stockQuantity) {
                    return {
                        ...session,
                        cart: session.cart.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item)
                    };
                } else {
                    toast.warning(`Stock insuffisant pour ${product.name}.`);
                    return session;
                }
            } else {
                if (1 <= stockQuantity) {
                    return {
                        ...session,
                        cart: [...session.cart, { ...product, cartQuantity: 1 }]
                    };
                } else {
                    toast.warning(`Stock insuffisant pour ${product.name}.`);
                    return session;
                }
            }
        });
    }, [products, activeSessionIndex]);
    
    const addCustomProductToCart = (name: string, price: number) => {
        const customProduct: SaleItem = {
            id: `custom-${Date.now()}`,
            name,
            price,
            quantity: 0, // Not from inventory
        };
        addProductToCart(customProduct);
        setIsAddingCustomProduct(false);
    };

    const updateCartQuantity = useCallback((productId: string, newQuantity: number) => {
        updateCurrentSession(session => {
            if (newQuantity <= 0) {
                return { ...session, cart: session.cart.filter(item => item.id !== productId) };
            }
            
            const productInStock = products?.find(p => p.id === productId);
            const stockQuantity = productInStock ? productInStock.quantity : Infinity;

            if (newQuantity > stockQuantity) {
                toast.warning(`Stock insuffisant pour ${productInStock?.name}. Quantité max : ${stockQuantity}`);
                return {
                    ...session,
                    cart: session.cart.map(item => item.id === productId ? { ...item, cartQuantity: stockQuantity } : item)
                };
            }
            
            return {
                ...session,
                cart: session.cart.map(item => item.id === productId ? { ...item, cartQuantity: newQuantity } : item)
            };
        });
    }, [products, activeSessionIndex]);

    const updateCartPrice = useCallback((productId: string, newPrice: number) => {
        updateCurrentSession(session => {
            return {
                ...session,
                cart: session.cart.map(item =>
                    item.id === productId && newPrice >= 0 ? { ...item, price: newPrice } : item
                )
            };
        });
    }, [activeSessionIndex]);

    const clearCart = useCallback(() => {
        updateCurrentSession((session) => ({ ...session, cart: [] }));
    }, [activeSessionIndex]);

    // Sale processing
    const handleFinalizeSale = (amountPaid: number) => {
        if (!firestore || !user) return;
        setIsProcessingSale(true);

        const cart = activeSession.cart;
        const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

        const newSale: Omit<Sale, 'id' | 'createdAt'> = {
            invoiceNumber: `INV-${Date.now()}`,
            items: cart.map(({ cartQuantity, ...item }) => ({...item, quantity: cartQuantity})), // save final quantity
            total: total,
            amountPaid: amountPaid,
            remainingBalance: total - amountPaid,
            paymentStatus: amountPaid >= total ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
            customerId: activeSession.customerId || undefined,
            customerName: activeSession.customerName || 'Vente au comptoir',
        };

        const batch = writeBatch(firestore);
        const salesRef = collection(firestore, 'users', user.uid, 'sales');
        const newSaleRef = doc(salesRef);
        batch.set(newSaleRef, { ...newSale, createdAt: serverTimestamp() });
        
        cart.forEach(item => {
            if (!item.id.startsWith('custom-')) {
                const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                const productInStock = products?.find(p => p.id === item.id);
                if (productInStock) {
                    const newQuantity = productInStock.quantity - item.cartQuantity;
                    batch.update(productRef, { quantity: newQuantity });
                }
            }
        });
        
        batch.commit().then(() => {
            setLastSale({ ...newSale, id: newSaleRef.id, createdAt: new Date() });
            setIsPaymentDialogOpen(false);
            setIsSaleComplete(true);
             // Instead of clearCart, we remove the completed session
            handleCloseSession(activeSessionIndex);
        }).catch((err) => {
            console.error("Error finalizing sale:", err);
            toast.error("Erreur lors de la finalisation de la vente.");
        }).finally(() => {
            setIsProcessingSale(false);
        });
    };
    
    // Session management
    const handleAddSession = () => {
        setSessions(s => [...s, { cart: [] }]);
        setActiveSessionIndex(sessions.length); // Switch to the new session
    };
    
    const handleCloseSession = (indexToClose: number) => {
        setSessions(currentSessions => {
            if (currentSessions.length === 1) {
                // If it's the last session, just clear it instead of removing it
                const newSessions = [...currentSessions];
                newSessions[indexToClose] = { cart: [], customerId: undefined, customerName: undefined };
                return newSessions;
            }
            
            const newSessions = currentSessions.filter((_, i) => i !== indexToClose);
            // Adjust active index if necessary
            if (activeSessionIndex >= indexToClose && activeSessionIndex > 0) {
                setActiveSessionIndex(activeSessionIndex - 1);
            } else if (activeSessionIndex === indexToClose && indexToClose === newSessions.length) {
                // If we closed the last tab, move to the new last tab
                setActiveSessionIndex(newSessions.length - 1);
            }
            return newSessions;
        });
    };
    
    const handleNewSale = () => {
        setIsSaleComplete(false);
        setLastSale(null);
        // The session is already cleared/closed by handleFinalizeSale
    };

     const handleSelectCustomer = (customerId: string) => {
        const customer = customers?.find(c => c.id === customerId);
        updateCurrentSession(session => ({
            ...session,
            customerId: customerId,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client inconnu"
        }));
    };

    const handleClearCustomer = () => {
        updateCurrentSession(session => ({
            ...session,
            customerId: undefined,
            customerName: undefined
        }));
    };
    
    // Keyboard shortcuts
     const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
             if (['F1', 'F2', 'F4'].includes(event.key) || (event.altKey && ['a', 'n'].includes(event.key.toLowerCase()))){
                 // allow shortcuts even if in input
             } else {
                return;
             }
        }
        
        if (event.key === 'F1') {
            event.preventDefault();
            setIsHelpOpen(true);
        } else if (event.key === 'F4') {
            event.preventDefault();
            if (activeSession.cart.length > 0) {
                setIsPaymentDialogOpen(true);
            } else {
                toast.info("Le panier est vide.");
            }
        } else if (event.altKey && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            setIsAddingCustomProduct(true);
        } else if (event.altKey && event.key.toLowerCase() === 'n') {
            event.preventDefault();
            setIsAddingProduct(true);
        }

    }, [activeSession.cart.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);


    const isLoading = isUserLoading || isLoadingProducts || isLoadingCompany || isLoadingCustomers || isLoadingSales || isLoadingPayments;
    
    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'interface de vente...</p></div>;
    }

    const total = activeSession.cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    return (
        <>
            {/* Dialogs and Modals */}
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <AddCustomProductForm isOpen={isAddingCustomProduct} onOpenChange={setIsAddingCustomProduct} onConfirm={addCustomProductToCart} />
            <ShortcutsHelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
            <AddCustomerForm 
                isOpen={isAddingCustomer} 
                onOpenChange={setIsAddingCustomer} 
                userId={user.uid}
                onCustomerAdded={(newId) => handleSelectCustomer(newId)}
            />
            {isPayingDebt && activeCustomer && (
                 <AddPaymentForm
                    isOpen={isPayingDebt}
                    onOpenChange={setIsPayingDebt}
                    userId={user.uid}
                    customer={activeCustomer}
                />
            )}
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                isProcessing={isProcessingSale}
                onConfirm={handleFinalizeSale}
            />
            {lastSale && (
                <SaleCompleteDialog
                    isOpen={isSaleComplete}
                    onOpenChange={handleNewSale}
                    sale={lastSale}
                    companyProfile={companyProfile}
                    customer={customers?.find(c => c.id === lastSale.customerId) || null}
                />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full max-h-full overflow-hidden">
                {/* Main Panel: Product Selection */}
                <div className="md:col-span-2 lg:col-span-3 h-full flex flex-col p-4 gap-4">
                    <ProductGrid 
                        products={products || []} 
                        onAddToCart={addProductToCart} 
                        onAddNewProduct={() => setIsAddingProduct(true)}
                        onAddCustomProduct={() => setIsAddingCustomProduct(true)}
                    />
                </div>

                {/* Side Panel: Cart */}
                <div className="md:col-span-1 lg:col-span-1 h-full flex flex-col bg-card border-l p-4">
                   <CartPanel
                        cart={activeSession.cart}
                        onUpdateQuantity={updateCartQuantity}
                        onUpdatePrice={updateCartPrice}
                        onClearCart={clearCart}
                        onFinalize={() => setIsPaymentDialogOpen(true)}
                        sessions={sessions}
                        activeSessionIndex={activeSessionIndex}
                        onSessionChange={setActiveSessionIndex}
                        onSessionAdd={handleAddSession}
                        onSessionClose={handleCloseSession}
                        customers={customers || []}
                        allSales={allSales || []}
                        allPayments={allPayments || []}
                        selectedCustomer={activeSession.customerId}
                        onSelectCustomer={handleSelectCustomer}
                        onClearCustomer={handleClearCustomer}
                        onAddNewCustomer={() => setIsAddingCustomer(true)}
                        onPayDebt={() => setIsPayingDebt(true)}
                   />
                </div>
            </div>
            {/* Help Button */}
            <button
                onClick={() => setIsHelpOpen(true)}
                className="absolute bottom-4 right-4 z-20 print-hide bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full h-12 w-12 flex items-center justify-center shadow-lg"
                aria-label="Aide et raccourcis"
            >
                <HelpCircle className="h-6 w-6" />
            </button>
        </>
    );
}
