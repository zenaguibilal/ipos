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
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import type { Customer } from '@/lib/types';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { CustomerDialog } from '@/components/customers/customer-dialog';

/**
 * @fileOverview Sell Page (Absolute State Singularity)
 * UI states are controlled via Zustand AppStore to prevent shadow state leakage.
 */

export default function SellPage() {
    const { 
        activeCartId, carts, modals, actions 
    } = useAppStore(state => ({
        activeCartId: state.activeCartId,
        carts: state.carts,
        modals: state.modals.sell,
        actions: state.actions
    }));
    
    const { 
        addProductToCart, setCartCustomer, 
        toggleSellProductSheet, toggleSellDebtPayment, toggleSellCustomerDialog 
    } = actions;
    
    const [localCartCustomer, setLocalCartCustomer] = useState<Customer | null>(null);
    const [customerListVersion, setCustomerListVersion] = useState(0);

    const productSearchRef = useRef<{ focus: () => void; openCustomProductDialog: () => void; }>(null);
    const customerComboboxRef = useRef<HTMLButtonElement>(null);
    const saleActionsRef = useRef<{ 
        payment: () => void;
        focusDiscount: () => void;
        toggleDiscountType: () => void;
        clearCart: () => void;
    }>(null);
    const draftsDropdownRef = useRef<{ open: () => void }>(null);

    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    // Authority: Fetch actual customer data from API, not local cache
    useEffect(() => {
        if (activeCart?.customerUuid) {
            api.get<Customer>(`customers/${activeCart.customerUuid}`).then(setLocalCartCustomer).catch(() => setLocalCartCustomer(null));
        } else {
            setLocalCartCustomer(null);
        }
    }, [activeCart?.customerUuid]);

    const handleSuccessfulPayment = useCallback(async () => {
        if (!localCartCustomer?.uuid) return;
        try {
            const updated = await api.get<Customer>(`customers/${localCartCustomer.uuid}`);
            setLocalCartCustomer(updated);
        } catch (error: any) {
            toast.error("Erreur de mise à jour du client.");
        }
    }, [localCartCustomer]);
    
    const handleCustomerDialogSuccess = (newCustomer?: Customer) => {
        if (newCustomer) setCartCustomer(newCustomer);
        setCustomerListVersion(v => v + 1);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        switch (e.key) {
            case 'F1': case 'F3': e.preventDefault(); productSearchRef.current?.focus(); break;
            case 'F2': e.preventDefault(); customerComboboxRef.current?.click(); break;
            case 'F4': e.preventDefault(); draftsDropdownRef.current?.open(); break;
            case 'F6': e.preventDefault(); saleActionsRef.current?.focusDiscount(); break;
            case 'F7': e.preventDefault(); saleActionsRef.current?.toggleDiscountType(); break;
            case 'F8': e.preventDefault(); saleActionsRef.current?.clearCart(); break;
            case 'F9': e.preventDefault(); saleActionsRef.current?.payment(); break;
            case 'F10': e.preventDefault(); productSearchRef.current?.openCustomProductDialog(); break;
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!activeCart) {
        return <div className="p-4"><Skeleton className="h-12 w-full mb-4" /><div className="grid grid-cols-3 gap-4 h-96"><Skeleton className="col-span-2"/><Skeleton /></div></div>;
    }
    
    return (
        <>
            <div className="h-full flex flex-col">
                <CartTotalBar cart={activeCart} customer={localCartCustomer} onPayDebtClick={() => toggleSellDebtPayment(true)} />
                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                           <div className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                                <div className="flex-grow sm:min-w-[300px]"><CustomerCombobox ref={customerComboboxRef} listVersion={customerListVersion} /></div>
                                <Button variant="outline" size="icon" onClick={() => toggleSellCustomerDialog(true)}><UserPlus className="h-4 w-4" /></Button>
                            </div>
                            <DraftsDropdown ref={draftsDropdownRef} />
                            <div className="md:hidden w-full">
                                <Sheet open={modals.isProductSheetOpen} onOpenChange={toggleSellProductSheet}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="w-full"><PackageSearch className="mr-2 h-4 w-4" />Produits</Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="p-0 w-full">
                                        <ProductSearch onProductSelect={addProductToCart} />
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
                    <div className="hidden md:flex md:flex-col">
                        <Card className="h-full flex flex-col">
                            <ProductSearch ref={productSearchRef} onProductSelect={addProductToCart} />
                        </Card>
                    </div>
                </div>
            </div>
            {localCartCustomer && <AddPaymentDialog isOpen={modals.isDebtPaymentDialogOpen} onOpenChange={toggleSellDebtPayment} customer={localCartCustomer} onPaymentSuccess={handleSuccessfulPayment} />}
            <CustomerDialog isOpen={modals.isCustomerDialogOpen} onOpenChange={toggleSellCustomerDialog} customer={null} onSuccess={handleCustomerDialogSuccess} />
            <PrintReceiptDialog />
        </>
    );
}
