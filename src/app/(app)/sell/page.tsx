
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

import type { Product, Customer, Sale, SaleItem, CustomerWithSalesData, CompanyProfile } from '@/lib/types';
import { ProductGrid } from '@/components/sell/product-grid';
import { CartPanel } from '@/components/sell/cart-panel';

export type ProductWithOptionalBarcode = Product & { barcode?: string };
export type CartItem = SaleItem & { cartQuantity: number };

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data fetching
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithOptionalBarcode>(productsCollectionRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    // Component state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSalesData | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSaleComplete, setIsSaleComplete] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isProcessingSale, setIsProcessingSale] = useState(false);

    // Modal states
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Cart management functions
    const addProductToCart = useCallback((product: Product | SaleItem) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === product.id);
            const productInStock = products?.find(p => p.id === product.id);
            const stockQuantity = productInStock ? productInStock.quantity : Infinity;

            if (existingItem) {
                if (existingItem.cartQuantity < stockQuantity) {
                    return currentCart.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
                } else {
                    toast.warning(`Stock insuffisant pour ${product.name}.`);
                    return currentCart;
                }
            } else {
                if (1 <= stockQuantity) {
                    return [...currentCart, { ...product, cartQuantity: 1 }];
                } else {
                    toast.warning(`Stock insuffisant pour ${product.name}.`);
                    return currentCart;
                }
            }
        });
    }, [products]);
    
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
        setCart(currentCart => {
            if (newQuantity <= 0) {
                return currentCart.filter(item => item.id !== productId);
            }
            
            const productInStock = products?.find(p => p.id === productId);
            const stockQuantity = productInStock ? productInStock.quantity : Infinity;

            if (newQuantity > stockQuantity) {
                toast.warning(`Stock insuffisant pour ${productInStock?.name}. Quantité max : ${stockQuantity}`);
                return currentCart.map(item => item.id === productId ? { ...item, cartQuantity: stockQuantity } : item);
            }
            
            return currentCart.map(item => item.id === productId ? { ...item, cartQuantity: newQuantity } : item);
        });
    }, [products]);


    const clearCart = useCallback(() => {
        setCart([]);
        setSelectedCustomer(null);
    }, []);

    // Sale processing
    const handleFinalizeSale = (amountPaid: number) => {
        if (!firestore || !user) return;
        setIsProcessingSale(true);

        const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

        const newSale: Omit<Sale, 'id' | 'createdAt'> = {
            invoiceNumber: `INV-${Date.now()}`,
            items: cart.map(({ cartQuantity, ...item }) => ({...item, quantity: cartQuantity})), // save final quantity
            total: total,
            amountPaid: amountPaid,
            remainingBalance: total - amountPaid,
            paymentStatus: amountPaid >= total ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Vente au comptoir',
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
            clearCart();
        }).catch((err) => {
            console.error("Error finalizing sale:", err);
            toast.error("Erreur lors de la finalisation de la vente.");
        }).finally(() => {
            setIsProcessingSale(false);
        });
    };
    
    const handleNewSale = () => {
        setIsSaleComplete(false);
        setLastSale(null);
        clearCart();
    }


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
            if (cart.length > 0) {
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

    }, [cart.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);


    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments || isLoadingCompany;
    
    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'interface de vente...</p></div>;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    return (
        <>
            {/* Dialogs and Modals */}
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <AddCustomProductForm isOpen={isAddingCustomProduct} onOpenChange={setIsAddingCustomProduct} onConfirm={addCustomProductToCart} />
            <ShortcutsHelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
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
                    customer={selectedCustomer}
                    companyProfile={companyProfile}
                />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full max-h-full overflow-hidden">
                {/* Left Panel: Product Selection */}
                <div className="lg:col-span-2 h-full flex flex-col p-4 gap-4">
                    <ProductGrid 
                        products={products || []} 
                        onAddToCart={addProductToCart} 
                        onAddNewProduct={() => setIsAddingProduct(true)}
                        onAddCustomProduct={() => setIsAddingCustomProduct(true)}
                    />
                </div>

                {/* Right Panel: Cart */}
                <div className="lg:col-span-1 h-full flex flex-col bg-card border-l p-4">
                   <CartPanel
                        cart={cart}
                        customers={customers || []}
                        sales={sales || []}
                        payments={payments || []}
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={setSelectedCustomer}
                        onUpdateQuantity={updateCartQuantity}
                        onClearCart={clearCart}
                        onFinalize={() => setIsPaymentDialogOpen(true)}
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
    