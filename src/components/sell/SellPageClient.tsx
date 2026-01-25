'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import type { Product, Customer, Cart, CartItem, Sale, SaleItem } from '@/lib/types';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { FinalizeSaleDialog } from './FinalizeSaleDialog';
import { CustomProductDialog } from './CustomProductDialog';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { ProductDialog } from '@/components/products/product-dialog';
import { Loader2 } from 'lucide-react';

export function SellPageClient() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [carts, setCarts] = useState<Cart[]>([{
        id: 'initial-cart',
        name: 'Panier 1',
        items: [],
        customerId: null,
        customerName: 'Vente au comptoir',
        discount: { type: 'fixed', value: 0 }
    }]);
    const [activeCartId, setActiveCartId] = useState<string>('initial-cart');
    const [isCartsLoading, setIsCartsLoading] = useState(true);

    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isSavingSale, setIsSavingSale] = useState(false);
    const [isCustomProductOpen, setIsCustomProductOpen] = useState(false);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const productsQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const customersQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    
    // Load carts from localStorage on initial mount
    useEffect(() => {
        try {
            const savedCarts = localStorage.getItem('ipos-carts');
            const savedActiveCartId = localStorage.getItem('ipos-active-cart-id');

            if (savedCarts) {
                const parsedCarts: Cart[] = JSON.parse(savedCarts);
                if (Array.isArray(parsedCarts) && parsedCarts.length > 0) {
                    const cleanedCarts = parsedCarts.map(cart => ({
                        ...cart,
                        items: cart.items.map(item => ({...item, flash: false }))
                    }));
                    setCarts(cleanedCarts);
                    
                    if (savedActiveCartId && cleanedCarts.some(c => c.id === savedActiveCartId)) {
                        setActiveCartId(savedActiveCartId);
                    } else {
                        setActiveCartId(cleanedCarts[0].id);
                    }
                } else {
                     const defaultCartId = uuidv4();
                     setCarts([{ id: defaultCartId, name: 'Panier 1', items: [], customerId: null, customerName: 'Vente au comptoir', discount: { type: 'fixed', value: 0 } }]);
                     setActiveCartId(defaultCartId);
                }
            } else {
                 const defaultCartId = uuidv4();
                 setCarts([{ id: defaultCartId, name: 'Panier 1', items: [], customerId: null, customerName: 'Vente au comptoir', discount: { type: 'fixed', value: 0 } }]);
                 setActiveCartId(defaultCartId);
            }
        } catch (error) {
            console.error("Failed to load carts from localStorage", error);
            const defaultCartId = uuidv4();
            setCarts([{ id: defaultCartId, name: 'Panier 1', items: [], customerId: null, customerName: 'Vente au comptoir', discount: { type: 'fixed', value: 0 } }]);
            setActiveCartId(defaultCartId);
        } finally {
            setIsCartsLoading(false);
        }
    }, []);

    // Save carts to localStorage whenever they change
    useEffect(() => {
        if (!isCartsLoading) {
            localStorage.setItem('ipos-carts', JSON.stringify(carts));
            localStorage.setItem('ipos-active-cart-id', activeCartId);
        }
    }, [carts, activeCartId, isCartsLoading]);


    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    const handleAddProductToCart = useCallback((product: Product | CartItem) => {
        if (!activeCart) return;

        if (product.quantity === 0 && !('cartQuantity' in product)) {
            toast.error(`${product.name} est en rupture de stock.`);
            return;
        }

        setCarts(prevCarts => prevCarts.map(cart => {
            if (cart.id === activeCartId) {
                const existingItem = cart.items.find(item => item.id === product.id);
                if (existingItem) {
                    if (existingItem.cartQuantity < product.quantity) {
                        return {
                            ...cart,
                            items: cart.items.map(item =>
                                item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1, flash: true } : item
                            )
                        };
                    } else {
                        toast.warning(`Stock maximum atteint pour ${product.name}.`);
                        return cart;
                    }
                } else {
                    const newItem: CartItem = {
                        ...product,
                        cartQuantity: 1,
                        flash: true,
                    };
                    return { ...cart, items: [newItem, ...cart.items] };
                }
            }
            return cart;
        }));

        // Remove flash effect after animation
        setTimeout(() => {
            setCarts(prev => prev.map(cart => {
                if (cart.id === activeCartId) {
                    return { ...cart, items: cart.items.map(i => ({ ...i, flash: false })) };
                }
                return cart;
            }));
        }, 500);
    }, [activeCart, activeCartId]);

    const handleUpdateCartItemQuantity = (productId: string, newQuantity: number) => {
        setCarts(prevCarts => prevCarts.map(cart => {
            if (cart.id === activeCartId) {
                const itemToUpdate = cart.items.find(i => i.id === productId);
                if (!itemToUpdate) return cart;

                if (newQuantity > 0 && newQuantity <= itemToUpdate.quantity) {
                    return {
                        ...cart,
                        items: cart.items.map(item =>
                            item.id === productId ? { ...item, cartQuantity: newQuantity } : item
                        )
                    };
                } else if (newQuantity === 0) {
                    return { ...cart, items: cart.items.filter(item => item.id !== productId) };
                } else if (newQuantity > itemToUpdate.quantity) {
                    toast.warning(`Stock insuffisant. ${itemToUpdate.quantity} articles restants pour ${itemToUpdate.name}.`);
                }
            }
            return cart;
        }));
    };

    const handleRemoveCartItem = (productId: string) => {
        setCarts(prevCarts => prevCarts.map(cart =>
            cart.id === activeCartId
                ? { ...cart, items: cart.items.filter(item => item.id !== productId) }
                : cart
        ));
    };
    
    const handleAddCustomProduct = (name: string, price: number) => {
        const customProduct: Omit<CartItem, 'minStockLevel'> = {
            id: `custom-${uuidv4()}`,
            name,
            price,
            purchasePrice: 0, 
            quantity: Infinity, // Not a stock-managed item
            cartQuantity: 1,
            createdAt: new Date(),
        };
        handleAddProductToCart(customProduct as CartItem);
        setIsCustomProductOpen(false);
    };

    const handleSelectCustomer = (customerId: string | null) => {
        const customer = customers?.find(c => c.id === customerId);
        setCarts(prevCarts => prevCarts.map(cart =>
            cart.id === activeCartId
                ? {
                    ...cart,
                    customerId: customerId,
                    customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Vente au comptoir'
                }
                : cart
        ));
    };

    const handleAddNewCustomer = (customer: Customer) => {
        handleSelectCustomer(customer.id);
        setIsCustomerDialogOpen(false);
    };

    const handleUpdateDiscount = (type: 'fixed' | 'percentage', value: number) => {
        if (!activeCart) return;

        const subtotal = activeCart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        let validatedValue = Math.max(0, value); // No negative discounts

        if (type === 'fixed' && validatedValue > subtotal) {
            toast.warning("La remise ne peut excéder le sous-total.");
            validatedValue = subtotal;
        } else if (type === 'percentage' && validatedValue > 100) {
            toast.warning("La remise ne peut excéder 100%.");
            validatedValue = 100;
        }

        setCarts(prevCarts => prevCarts.map(cart =>
            cart.id === activeCartId
                ? { ...cart, discount: { type, value: validatedValue } }
                : cart
        ));
    };

    const handleClearCart = () => {
        setCarts(prevCarts => prevCarts.map(cart =>
            cart.id === activeCartId ? { ...cart, items: [], discount: { type: 'fixed', value: 0 } } : cart
        ));
    };

    const handleAddCart = () => {
        const newCartName = `Panier ${carts.length + 1}`;
        const newCart: Cart = {
            id: uuidv4(),
            name: newCartName,
            items: [],
            customerId: null,
            customerName: 'Vente au comptoir',
            discount: { type: 'fixed', value: 0 }
        };
        setCarts(prev => [...prev, newCart]);
        setActiveCartId(newCart.id);
    };
    
    const handleRemoveCart = (cartId: string) => {
        if (carts.length === 1) {
            toast.error("Impossible de supprimer le dernier panier.");
            return;
        }
        
        const remainingCarts = carts.filter(c => c.id !== cartId);
        setCarts(remainingCarts);
        
        if(activeCartId === cartId) {
            setActiveCartId(remainingCarts[0].id);
        }
    };
    
    const handleFinalizeSale = async (amountPaid: number, paymentMethod: 'cash' | 'card' | 'other') => {
        if (!firestore || !user || !activeCart) return;

        setIsSavingSale(true);
        
        const cartToPay = activeCart;
        const saleId = uuidv4();
    
        const subtotal = cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        const discountValue = cartToPay.discount.value;
        const discountType = cartToPay.discount.type;
        const discountAmount = discountType === 'fixed'
            ? discountValue
            : (subtotal * discountValue) / 100;
        const total = subtotal - discountAmount;
    
        const finalPaymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    
        const saleItems: SaleItem[] = cartToPay.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            quantity: item.cartQuantity
        }));

        const newSaleData = {
            invoiceNumber: `INV-${Date.now()}`,
            items: saleItems,
            subtotal: subtotal,
            discountType: discountType,
            discountAmount: discountValue,
            total: total,
            amountPaid: amountPaid,
            remainingBalance: total - amountPaid,
            paymentStatus: finalPaymentStatus,
            paymentMethod: paymentMethod,
            customerId: cartToPay.customerId ?? undefined,
            customerName: cartToPay.customerName,
        };
    
        try {
            await runTransaction(firestore, async (transaction) => {
                const saleRef = doc(firestore, 'users', user.uid, 'sales', saleId);

                for (const item of cartToPay.items) {
                    if (!item.id.startsWith('custom-')) {
                        const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                        const productDoc = await transaction.get(productRef);
                        
                        if (!productDoc.exists()) {
                            throw new Error(`Produit ${item.name} non trouvé.`);
                        }
    
                        const currentQuantity = productDoc.data().quantity;
                        const newQuantity = currentQuantity - item.cartQuantity;
    
                        if (newQuantity < 0) {
                            throw new Error(`Stock insuffisant pour ${item.name}.`);
                        }
                        
                        transaction.update(productRef, { quantity: newQuantity });
                    }
                }
    
                transaction.set(saleRef, {...newSaleData, createdAt: serverTimestamp()});
            });
    
            toast.success("Vente finalisée avec succès!");
            const completedSaleDataForDialog: Sale = {
                id: saleId,
                ...newSaleData,
                createdAt: new Date(), 
            };
            setCompletedSale(completedSaleDataForDialog);

            // Reset or remove cart
            if (carts.length > 1) {
                handleRemoveCart(activeCartId);
            } else {
                handleClearCart();
            }
    
        } catch (error: any) {
            console.error("Erreur lors de la finalisation de la vente:", error);
            toast.error(error.message || "Une erreur est survenue lors de la vente.");
        } finally {
            setIsFinalizeOpen(false);
            setIsSavingSale(false);
        }
    };
    

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F4') {
                e.preventDefault();
                if(activeCart && activeCart.items.length > 0) {
                    setIsFinalizeOpen(true);
                } else {
                    toast.info("Le panier est vide.")
                }
            }
            if (e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsCustomProductOpen(true);
            }
             if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setIsNewProductDialogOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCart]);

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isCartsLoading;

    if (isLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Chargement de l'interface de vente...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen max-h-screen overflow-hidden grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4">
            <ProductGrid
                products={products || []}
                cartItems={activeCart?.items || []}
                isLoading={isLoadingProducts}
                onProductSelect={handleAddProductToCart}
                onAddCustomProduct={() => setIsCustomProductOpen(true)}
                onAddNewProduct={() => setIsNewProductDialogOpen(true)}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />
            <CartPanel
                carts={carts}
                activeCartId={activeCartId}
                customers={customers || []}
                isLoading={isLoadingCustomers}
                onAddCart={handleAddCart}
                onRemoveCart={handleRemoveCart}
                onSwitchCart={setActiveCartId}
                onUpdateQuantity={handleUpdateCartItemQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onSelectCustomer={handleSelectCustomer}
                onFinalize={() => setIsFinalizeOpen(true)}
                onUpdateDiscount={handleUpdateDiscount}
                onAddNewCustomer={() => setIsCustomerDialogOpen(true)}
            />

            {activeCart && <FinalizeSaleDialog
                isOpen={isFinalizeOpen}
                onOpenChange={setIsFinalizeOpen}
                cart={activeCart}
                onConfirm={handleFinalizeSale}
                isSaving={isSavingSale}
            />}

            <CustomProductDialog
                isOpen={isCustomProductOpen}
                onOpenChange={setIsCustomProductOpen}
                onConfirm={handleAddCustomProduct}
            />
            
            {user && <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={null}
                userId={user.uid}
                onCustomerAdded={handleAddNewCustomer}
            />}

            {user && <ProductDialog
                isOpen={isNewProductDialogOpen}
                onOpenChange={setIsNewProductDialogOpen}
                product={null}
                userId={user.uid}
            />}

            {completedSale && (
                <SaleDetailsDialog
                    isOpen={!!completedSale}
                    onOpenChange={() => setCompletedSale(null)}
                    sale={completedSale}
                    companyProfile={null} // Not needed for this context
                    customer={customers?.find(c => c.id === completedSale.customerId) || null}
                />
            )}
        </div>
    );
}
