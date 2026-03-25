'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { PackageSearch, HandCoins } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import type { Product, Customer } from '@/lib/types';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { customerService } from '@/services/customer.service';

export default function SellPage() {
    const { cart, cartCustomer, isCartLoading } = useAppStore(state => ({
        cart: state.cart,
        cartCustomer: state.cartCustomer,
        isCartLoading: state.isCartLoading,
    }));
    const { addProductToCart, clearCart, finalizeSale } = useAppActions();
    
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const productSearchRef = useRef<{ focus: () => void }>(null);
    const customerComboboxRef = useRef<HTMLButtonElement>(null);
    const saleActionsRef = useRef<{ payment: () => void; }>(null);

    const cartItemsCountRef = useRef(cart?.items.length ?? 0);
    useEffect(() => {
        cartItemsCountRef.current = cart?.items.length ?? 0;
    }, [cart?.items.length]);

    const handleSuccessfulPayment = useCallback(async () => {
        if (!cartCustomer) return;
        try {
            // Re-fetch customer to update state after payment
            const updatedCustomer = await customerService.recalculateCustomerStatus(cartCustomer.uuid);
            useAppActions.setCartCustomer(updatedCustomer || null);
        } catch (error) {
            console.error("Failed to refetch customer data", error);
            toast.error("Impossible de rafraîchir les données du client.");
        }
    }, [cartCustomer]);

    const handleSaleFinalized = useCallback(() => {
        // The store action now handles clearing the cart.
        // We might want to refresh the customer here too if they were involved.
        if (cart.customerUuid) {
            handleSuccessfulPayment();
        }
    }, [cart.customerUuid, handleSuccessfulPayment]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

        switch (e.key) {
            case 'F1':
            case 'F3':
                e.preventDefault();
                productSearchRef.current?.focus();
                break;
            case 'F2':
                e.preventDefault();
                customerComboboxRef.current?.click();
                break;
            case 'F9':
                e.preventDefault();
                if (cartItemsCountRef.current > 0) {
                    saleActionsRef.current?.payment();
                } else {
                    toast.info("Le panier est vide. Impossible de finaliser la vente.");
                }
                break;
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const isDataLoading = isCartLoading || !cart;

    if (isDataLoading) {
        return (
            <div className="h-full flex flex-col p-4 gap-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid md:grid-cols-3 gap-4 flex-grow">
                    <Skeleton className="md:col-span-2 h-full" />
                    <Skeleton className="h-full" />
                </div>
            </div>
        );
    }
    
    const handleProductSelected = (product: Product, quantity: number) => {
        addProductToCart(product, quantity);
        setIsProductSheetOpen(false);
    }

    return (
        <>
            <div className="h-full flex flex-col">
                <CartTotalBar />

                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    {/* Main column */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-grow w-full sm:w-64">
                                <CustomerCombobox ref={customerComboboxRef} />
                            </div>
                            <div className="flex gap-2">
                                {cartCustomer && cartCustomer.outstandingBalance > 0 && (
                                    <Button 
                                        variant="outline" 
                                        className="h-auto" 
                                        onClick={() => setIsPaymentDialogOpen(true)}
                                    >
                                        <HandCoins className="mr-2 h-4 w-4 text-primary" />
                                        Payer Dette
                                    </Button>
                                )}
                                <div className="md:hidden">
                                    <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" className="w-full sm:w-auto h-full">
                                                <PackageSearch className="mr-2 h-4 w-4" />
                                                Produits
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="p-0 w-full max-w-full sm:max-w-md">
                                            <ProductSearch ref={productSearchRef} onProductSelect={handleProductSelected} />
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        </div>

                        <Card className="flex-grow flex flex-col min-h-0">
                            <CartDisplay />
                        </Card>

                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <SaleActions
                                    ref={saleActionsRef}
                                    onSaleFinalized={handleSaleFinalized}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column (Product Search) */}
                    <div className="hidden md:flex md:flex-col">
                        <Card className="h-full flex flex-col">
                            <ProductSearch ref={productSearchRef} onProductSelect={handleProductSelected} />
                        </Card>
                    </div>
                </div>
            </div>
            {cartCustomer && (
                 <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={cartCustomer}
                    onPaymentSuccess={handleSuccessfulPayment}
                />
            )}
        </>
    );
}
