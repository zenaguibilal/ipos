'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { DraftsDropdown } from '@/components/sell/DraftsDropdown';
import { PackageSearch, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import type { Product, Customer } from '@/lib/types';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { customerService } from '@/services/customer.service';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { CustomerDialog } from '@/components/customers/customer-dialog';

export default function SellPage() {
    const { activeCartId, carts, sessionLoading } = useAppStore(state => ({
        activeCartId: state.activeCartId,
        carts: state.carts,
        sessionLoading: state.sessionLoading,
    }));
    const { addProductToCart, setCartCustomer } = useAppActions();
    
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isDebtPaymentDialogOpen, setIsDebtPaymentDialogOpen] = useState(false);
    const [cartCustomer, setLocalCartCustomer] = useState<Customer | null>(null);

    // State for the "Add Customer" dialog
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [customerListVersion, setCustomerListVersion] = useState(0);

    const productSearchRef = useRef<{ focus: () => void }>(null);
    const customerComboboxRef = useRef<HTMLButtonElement>(null);
    const saleActionsRef = useRef<{ payment: () => void; }>(null);

    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    // Effect to fetch and set the customer object when the active cart's customerUuid changes
    useEffect(() => {
        if (activeCart?.customerUuid) {
            customerService.getCustomerByUuid(activeCart.customerUuid).then(customer => {
                setLocalCartCustomer(customer || null);
            }).catch(() => setLocalCartCustomer(null));
        } else {
            setLocalCartCustomer(null);
        }
    }, [activeCart?.customerUuid]);


    const cartItemsCountRef = useRef(activeCart?.items.length ?? 0);
    useEffect(() => {
        cartItemsCountRef.current = activeCart?.items.length ?? 0;
    }, [activeCart?.items.length]);

    const handleSuccessfulPayment = useCallback(async () => {
        if (!cartCustomer?.uuid) return;
        try {
            // Re-fetch customer to update their status in the store
            const updatedCustomer = await customerService.getCustomerByUuid(cartCustomer.uuid);
            if (updatedCustomer) {
                setLocalCartCustomer(updatedCustomer);
            }
        } catch (error: any) {
            toast.error("Erreur lors de la mise à jour du client.", { description: error.message });
        }
    }, [cartCustomer]);
    
    const handlePayDebtClick = () => {
        setIsDebtPaymentDialogOpen(true);
    };

    const handleCustomerDialogSuccess = (newCustomer?: Customer) => {
        if (newCustomer) {
            // Automatically select the newly created customer
            setCartCustomer(newCustomer);
        }
        // Trigger a re-fetch in the combobox
        setCustomerListVersion(v => v + 1);
    };


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

    // Add confirmation before leaving the page if cart is not empty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          // The message is controlled by the browser, we just need to trigger it.
          e.preventDefault();
          e.returnValue = '';
        };
    
        if (activeCart && activeCart.items.length > 0) {
          window.addEventListener('beforeunload', handleBeforeUnload);
        }
    
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeCart?.items.length]);

    const isDataLoading = sessionLoading || !activeCart;

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
        try {
            addProductToCart(product, quantity);
            setIsProductSheetOpen(false);
            productSearchRef.current?.focus();
        } catch(error: any) {
            toast.error(error.message);
        }
    }

    return (
        <>
            <div className="h-full flex flex-col">
                <CartTotalBar cart={activeCart} customer={cartCustomer} onPayDebtClick={handlePayDebtClick} />

                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    {/* Main column */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                           <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 w-full sm:w-auto">
                                <div className="flex-grow sm:min-w-[300px]">
                                    <CustomerCombobox ref={customerComboboxRef} listVersion={customerListVersion} />
                                </div>
                                <Button variant="outline" size="icon" onClick={() => setIsCustomerDialogOpen(true)}>
                                    <UserPlus className="h-4 w-4" />
                                    <span className="sr-only">Ajouter un client</span>
                                </Button>
                            </div>
                            <div className="flex-grow sm:flex-grow-0 w-full sm:w-auto">
                                <DraftsDropdown />
                            </div>
                            <div className="w-full sm:w-auto md:hidden">
                                <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <PackageSearch className="mr-2 h-4 w-4" />
                                            Rechercher des produits
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="p-0 w-full max-w-full sm:max-w-md">
                                        <ProductSearch onProductSelect={handleProductSelected} />
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        <Card className="flex-grow flex flex-col min-h-0">
                            <CardContent className="p-4 sm:p-6 flex-grow flex flex-col min-h-0">
                                <CartDisplay cart={activeCart} />
                            </CardContent>
                            <CardFooter className="p-4 sm:p-6 mt-auto border-t bg-background/30">
                                <SaleActions ref={saleActionsRef} />
                            </CardFooter>
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
                    isOpen={isDebtPaymentDialogOpen}
                    onOpenChange={setIsDebtPaymentDialogOpen}
                    customer={cartCustomer}
                    onPaymentSuccess={handleSuccessfulPayment}
                />
            )}
            <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={null}
                onSuccess={handleCustomerDialogSuccess}
            />
            <PrintReceiptDialog />
        </>
    );
}
