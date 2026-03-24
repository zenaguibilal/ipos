'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCarts } from '@/hooks/useCarts';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { CartTabs } from '@/components/sell/CartTabs';
import { PackageSearch, HandCoins } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DraftsDialog } from '@/components/sell/DraftsDialog';
import { dataService } from '@/services/data-service';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import type { Customer, Product } from '@/lib/types';

export default function SellPage() {
    const {
        carts,
        activeCart,
        activeCartId,
        setActiveCartId,
        addCart,
        removeCart,
        addProductToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        setCartCustomer,
        setCartDiscount,
        saveActiveCartAsDraft,
        loadDraftToCart,
        isLoading,
    } = useCarts();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null | undefined>();

    useEffect(() => {
        if(activeCart?.customerId) {
            dataService.getCustomerById(activeCart.customerId).then(setSelectedCustomer);
        } else {
            setSelectedCustomer(null);
        }
    }, [activeCart?.customerId]);

    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const productSearchRef = useRef<{ focus: () => void }>(null);
    const customerComboboxRef = useRef<HTMLButtonElement>(null);
    const paymentButtonRef = useRef<HTMLButtonElement>(null);

    const handleSaveDraft = async () => {
        if (!activeCart || activeCart.items.length === 0) {
            toast.error("Impossible d'enregistrer un panier vide comme brouillon.");
            return;
        }
        try {
            await saveActiveCartAsDraft();
            await clearCart();
            toast.success("Brouillon enregistré avec succès. Le panier a été vidé.");
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement du brouillon.");
        }
    };

    const handleLoadDraft = (draftId: number) => {
        loadDraftToCart(draftId);
        setIsDraftsDialogOpen(false);
    };

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
                handleSaveDraft();
                break;
            case 'F6':
                e.preventDefault();
                setIsDraftsDialogOpen(true);
                break;
            case 'F9':
                e.preventDefault();
                if (activeCart && activeCart.items.length > 0) {
                    paymentButtonRef.current?.click();
                } else {
                    toast.info("Le panier est vide. Impossible de finaliser la vente.");
                }
                break;
        }
    }, [activeCart, handleSaveDraft]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const isDataLoading = isLoading || !activeCart || selectedCustomer === undefined;

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
                <CartTotalBar cart={activeCart} customer={selectedCustomer || undefined} />

                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    {/* Main column */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-grow">
                                <CartTabs
                                    carts={carts}
                                    activeCartId={activeCartId}
                                    onTabChange={setActiveCartId}
                                    onAddCart={addCart}
                                    onRemoveCart={removeCart}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-full sm:w-64">
                                    <CustomerCombobox
                                        ref={customerComboboxRef}
                                        customerId={activeCart.customerId}
                                        onSelectCustomer={setCartCustomer}
                                    />
                                </div>
                                {selectedCustomer && selectedCustomer.outstandingBalance > 0 && (
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
                                cart={activeCart}
                                onQuantityChange={updateCartItemQuantity}
                                onRemoveItem={removeCartItem}
                            />
                        </Card>

                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <SaleActions
                                    cart={activeCart}
                                    customer={selectedCustomer}
                                    onClearCart={clearCart}
                                    onSetDiscount={setCartDiscount}
                                    onSaveDraft={handleSaveDraft}
                                    onOpenDrafts={() => setIsDraftsDialogOpen(true)}
                                    onSaleFinalized={handleSaleFinalized}
                                    ref={paymentButtonRef}
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
            <DraftsDialog 
                isOpen={isDraftsDialogOpen}
                onOpenChange={setIsDraftsDialogOpen}
                onLoadDraft={handleLoadDraft}
            />
            {selectedCustomer && (
                 <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={selectedCustomer}
                    outstandingBalance={selectedCustomer.outstandingBalance}
                />
            )}
        </>
    );
}
