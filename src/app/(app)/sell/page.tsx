'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { PackageSearch, HandCoins } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import { DraftsDialog } from '@/components/sell/DraftsDialog';
import type { Customer, Product } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { customerService } from '@/services';

export default function SellPage() {
    const {
        cart,
        isLoading,
        addProductToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        setCartCustomer,
        setCartDiscount,
        saveCartAsDraft,
        loadDraftToCart,
    } = useCart();

    const customer = useLiveQuery(
        () => cart?.customerUuid ? customerService.getCustomerByUuid(cart.customerUuid) : Promise.resolve(undefined),
        [cart?.customerUuid]
    );

    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false);

    const productSearchRef = useRef<{ focus: () => void }>(null);
    const customerComboboxRef = useRef<HTMLButtonElement>(null);
    const saleActionsRef = useRef<{ payment: () => void; draft: () => void; }>(null);


    const handleSaleFinalized = useCallback(() => {
        clearCart();
    }, [clearCart]);

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
            case 'F4':
                 e.preventDefault();
                 saleActionsRef.current?.draft();
                break;
            case 'F6':
                e.preventDefault();
                setIsDraftsDialogOpen(true);
                break;
            case 'F9':
                e.preventDefault();
                if (cart && cart.items.length > 0) {
                    saleActionsRef.current?.payment();
                } else {
                    toast.info("Le panier est vide. Impossible de finaliser la vente.");
                }
                break;
        }
    }, [cart]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const isDataLoading = isLoading || !cart;

    if (isDataLoading) {
        return (
            <div className="h-full flex flex-col p-4 gap-4">
                <Skeleton className="h-12 flex-grow" />
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
                <CartTotalBar cart={cart} customer={customer} />

                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    {/* Main column */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-grow w-full sm:w-64">
                                <CustomerCombobox
                                    ref={customerComboboxRef}
                                    customerUuid={cart.customerUuid}
                                    onSelectCustomer={(c) => setCartCustomer(c)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {customer && customer.outstandingBalance > 0 && (
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
                            <CartDisplay
                                cart={cart}
                                onQuantityChange={updateCartItemQuantity}
                                onRemoveItem={removeCartItem}
                            />
                        </Card>

                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <SaleActions
                                    ref={saleActionsRef}
                                    cart={cart}
                                    customer={customer}
                                    onClearCart={clearCart}
                                    onSetDiscount={setCartDiscount}
                                    onSaveDraft={saveCartAsDraft}
                                    onOpenDrafts={() => setIsDraftsDialogOpen(true)}
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
            {customer && (
                 <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    outstandingBalance={customer.outstandingBalance}
                />
            )}
            <DraftsDialog
                isOpen={isDraftsDialogOpen}
                onOpenChange={setIsDraftsDialogOpen}
                onLoadDraft={loadDraftToCart}
            />
        </>
    );
}
