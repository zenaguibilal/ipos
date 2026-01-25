'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, serverTimestamp, getDoc, runTransaction, query } from 'firebase/firestore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import type { Product, Customer, Cart, CartItem, Sale, SaleItem, Payment, CompanyProfile, SalePayment, CustomerWithSalesData } from '@/lib/types';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const FinalizeSaleDialog = dynamic(() => import('./FinalizeSaleDialog').then(mod => mod.FinalizeSaleDialog));
const CustomProductDialog = dynamic(() => import('./CustomProductDialog').then(mod => mod.CustomProductDialog));
const SaleDetailsDialog = dynamic(() => import('@/components/sales/sale-details-dialog').then(mod => mod.SaleDetailsDialog));
const CustomerDialog = dynamic(() => import('@/components/customers/customer-dialog').then(mod => mod.CustomerDialog));
const ProductDialog = dynamic(() => import('@/components/products/product-dialog').then(mod => mod.ProductDialog));
const AddPaymentForm = dynamic(() => import('@/components/customers/add-payment-form').then(mod => mod.AddPaymentForm));


export function SellPageClient() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartId] = useState<string>('');
    const [isCartsLoading, setIsCartsLoading] = useState(true);

    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isSavingSale, setIsSavingSale] = useState(false);
    const [isCustomProductOpen, setIsCustomProductOpen] = useState(false);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);


    const productsQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const customersQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const salesQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'sales')) : null, [user, firestore]);
    const paymentsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'payments')) : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    const { data: companyProfile } = useDoc<CompanyProfile>(companyDocRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    
    // Load carts from localStorage on initial mount
    useEffect(() => {
        const initializeCarts = () => {
            try {
                const savedCarts = localStorage.getItem('ipos-carts');
                const savedActiveCartId = localStorage.getItem('ipos-active-cart-id');
                if (savedCarts) {
                    const parsedCarts: Cart[] = JSON.parse(savedCarts);
                    if (Array.isArray(parsedCarts) && parsedCarts.length > 0) {
                        const cleanedCarts = parsedCarts.map(cart => ({
                            ...cart,
                            items: cart.items.map(item => ({ ...item, flash: false }))
                        }));
                        setCarts(cleanedCarts);
                        setActiveCartId(savedActiveCartId && cleanedCarts.some(c => c.id === savedActiveCartId) ? savedActiveCartId : cleanedCarts[0].id);
                        return;
                    }
                }
            } catch (error) {
                console.error("Failed to load or parse carts from localStorage", error);
            }

            // Default case if anything fails or no carts are saved
            const defaultCartId = uuidv4();
            setCarts([{ id: defaultCartId, name: 'Panier 1', items: [], customerId: null, customerName: 'Vente au comptoir', discount: { type: 'fixed', value: 0 } }]);
            setActiveCartId(defaultCartId);
        };

        initializeCarts();
        setIsCartsLoading(false);
    }, []);

    // Sync carts with live product data from Firestore
    useEffect(() => {
        if (isCartsLoading || !products) {
            return;
        }

        setCarts(prevCarts => {
            let hasChanges = false;
            const updatedCarts = prevCarts.map(cart => {
                let cartHasChanges = false;
                const updatedItems = cart.items.map(item => {
                    if (item.id.startsWith('custom-')) {
                        return item;
                    }
                    const productData = products.find(p => p.id === item.id);

                    if (productData) {
                        const newCartQuantity = Math.min(item.cartQuantity, productData.quantity);
                        if (
                            item.name !== productData.name ||
                            item.price !== productData.price ||
                            item.quantity !== productData.quantity ||
                            item.cartQuantity !== newCartQuantity
                        ) {
                            cartHasChanges = true;
                            if (item.cartQuantity > newCartQuantity) {
                                toast.info(`La quantité de "${productData.name}" a été ajustée au stock disponible (${productData.quantity}).`);
                            }
                            return {
                                ...productData,
                                cartQuantity: newCartQuantity,
                                flash: item.flash
                            };
                        }
                    } else {
                        cartHasChanges = true;
                        toast.warning(`Le produit "${item.name}" a été retiré du panier car il n'existe plus.`);
                        return null;
                    }
                    return item;
                }).filter((item): item is CartItem => item !== null && item.cartQuantity > 0);
                
                if (cartHasChanges) hasChanges = true;
                return { ...cart, items: updatedItems };
            });

            if (hasChanges) {
                return updatedCarts;
            }
            return prevCarts;
        });
    }, [products, isCartsLoading]);

    // Save carts to localStorage whenever they change
    useEffect(() => {
        if (!isCartsLoading) {
            localStorage.setItem('ipos-carts', JSON.stringify(carts));
            localStorage.setItem('ipos-active-cart-id', activeCartId);
        }
    }, [carts, activeCartId, isCartsLoading]);


    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    const customersWithSalesData = useMemo<CustomerWithSalesData[]>(() => {
        if (!customers || !sales || !payments) return [];

        return customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const customerPayments = payments.filter(p => p.customerId === customer.id);
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);

            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;

            return {
                ...customer,
                totalSpent,
                outstandingBalance: finalBalance,
            };
        });
    }, [customers, sales, payments]);

    const activeCustomer = useMemo(() => {
        if (!activeCart?.customerId || !customersWithSalesData) return null;
        return customersWithSalesData.find(c => c.id === activeCart.customerId) || null;
    }, [activeCart?.customerId, customersWithSalesData]);
    
    const customerBalance = activeCustomer?.outstandingBalance;

    const topProducts = useMemo(() => {
        if (!products || !sales) return [];

        const productSalesCount: { [productId: string]: number } = {};

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.id && !item.id.startsWith('custom-')) {
                    productSalesCount[item.id] = (productSalesCount[item.id] || 0) + item.quantity;
                }
            });
        });

        const sortedProducts = [...products].sort((a, b) => {
            const countA = productSalesCount[a.id] || 0;
            const countB = productSalesCount[b.id] || 0;
            return countB - countA;
        });

        return sortedProducts.slice(0, 15);
    }, [products, sales]);


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
            quantity: Infinity,
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
        let validatedValue = Math.max(0, value);

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
    
    const handleFinalizeSale = async (payments: SalePayment[], settleDebt: boolean) => {
        if (!firestore || !user || !activeCart) return;

        setIsSavingSale(true);
        const cartToPay = { ...activeCart }; // Create a stable copy of the cart

        try {
            const saleId = uuidv4();
            
            const newSaleData = await runTransaction(firestore, async (transaction) => {
                // 1. Verify stock and get product data within the transaction
                for (const item of cartToPay.items) {
                    if (!item.id.startsWith('custom-')) {
                        const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                        const productDoc = await transaction.get(productRef);
                        if (!productDoc.exists() || productDoc.data().quantity < item.cartQuantity) {
                            throw new Error(`Stock insuffisant pour ${item.name}. ${productDoc.exists() ? productDoc.data().quantity : 0} restant(s).`);
                        }
                        // 2. Update stock
                        const newQuantity = productDoc.data().quantity - item.cartQuantity;
                        transaction.update(productRef, { quantity: newQuantity });
                    }
                }

                // 3. Prepare Sale Data
                const totalAmountFromPayments = payments.reduce((acc, p) => acc + p.amount, 0);
                const cartSubtotal = cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
                const { value: discountValue, type: discountType } = cartToPay.discount;
                const discountAmount = discountType === 'fixed' ? discountValue : (cartSubtotal * discountValue) / 100;
                const saleTotal = cartSubtotal - discountAmount;
                
                let saleAmountPaid = totalAmountFromPayments;
                const currentCustomerBalance = customerBalance || 0;

                // 4. Handle Debt Settlement
                if (settleDebt && currentCustomerBalance > 0 && cartToPay.customerId) {
                    const amountToClearDebt = Math.min(totalAmountFromPayments, currentCustomerBalance);
                    if (amountToClearDebt > 0) {
                        const paymentRef = doc(collection(firestore, 'users', user.uid, 'payments'));
                        transaction.set(paymentRef, {
                            customerId: cartToPay.customerId,
                            customerName: cartToPay.customerName,
                            amount: amountToClearDebt,
                            createdAt: serverTimestamp()
                        });
                    }
                    saleAmountPaid = Math.max(0, totalAmountFromPayments - amountToClearDebt);
                }

                const finalPaymentStatus = saleAmountPaid >= saleTotal ? 'paid' : saleAmountPaid > 0 ? 'partial' : 'unpaid';
                
                const saleDataForDb = {
                    invoiceNumber: `INV-${Date.now()}`,
                    items: cartToPay.items.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: item.cartQuantity
                    })),
                    subtotal: cartSubtotal,
                    discountType,
                    discountAmount: discountValue,
                    total: saleTotal,
                    amountPaid: saleAmountPaid,
                    remainingBalance: saleTotal - saleAmountPaid,
                    paymentStatus: finalPaymentStatus,
                    payments,
                    customerId: cartToPay.customerId ?? undefined,
                    customerName: cartToPay.customerName,
                    createdAt: serverTimestamp()
                };

                // 5. Create Sale Document
                const saleRef = doc(firestore, 'users', user.uid, 'sales', saleId);
                transaction.set(saleRef, saleDataForDb);
                
                return saleDataForDb;
            });

            // After transaction success
            toast.success("Vente finalisée avec succès!");
            setCompletedSale({ id: saleId, ...newSaleData, createdAt: new Date() } as Sale);

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

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isCartsLoading || isLoadingSales || isLoadingPayments;

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
                products={topProducts}
                cartItems={activeCart?.items || []}
                isLoading={isLoadingProducts || isLoadingSales}
                onProductSelect={handleAddProductToCart}
                onAddCustomProduct={() => setIsCustomProductOpen(true)}
                onAddNewProduct={() => setIsNewProductDialogOpen(true)}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />
            <CartPanel
                carts={carts}
                activeCartId={activeCartId}
                customersWithData={customersWithSalesData}
                isLoading={isLoadingCustomers || isLoadingSales || isLoadingPayments}
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
                onSettleDebt={() => setIsPaymentDialogOpen(true)}
            />

            {activeCart && <FinalizeSaleDialog
                isOpen={isFinalizeOpen}
                onOpenChange={setIsFinalizeOpen}
                cart={activeCart}
                onConfirm={handleFinalizeSale}
                isSaving={isSavingSale}
                customerBalance={customerBalance}
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
            
            {activeCustomer && user && (
                <AddPaymentForm
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={activeCustomer}
                    userId={user.uid}
                />
            )}

            {completedSale && (
                <SaleDetailsDialog
                    isOpen={!!completedSale}
                    onOpenChange={() => setCompletedSale(null)}
                    sale={completedSale}
                    companyProfile={companyProfile || null}
                    customer={customers?.find(c => c.id === completedSale.customerId) || null}
                />
            )}
        </div>
    );
}
