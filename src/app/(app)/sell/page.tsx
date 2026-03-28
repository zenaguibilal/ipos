
'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { DraftsDropdown } from '@/components/sell/DraftsDropdown';
import { PackageSearch, UserPlus, HelpCircle, Keyboard, ShieldX, Loader2 } from 'lucide-react';
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * @fileOverview Sell Page (Sovereign Terminal Console)
 * المرحلة النهائية: تكامل الاختصارات، الرقابة الائتمانية، والسرعة القصوى.
 */

export default function SellPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { 
        profile, activeCartId, carts, modals, actions, sellPage 
    } = useAppStore(state => ({
        profile: state.profile,
        activeCartId: state.activeCartId,
        carts: state.carts,
        modals: state.modals.sell,
        actions: state.actions,
        sellPage: state.sellPage
    }));
    
    const { 
        addProductToCart, setCartCustomer, 
        toggleSellProductSheet, toggleSellDebtPayment, toggleSellCustomerDialog,
        refreshSellCustomer, incrementCustomerListVersion
    } = actions;

    const isAllowed = profile?.permissions?.includes('sell') || isManagerOrAdmin;

    // Absolute Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Accès Caisse Refusé", { 
                description: "Vous ne possédez pas le décret nécessaire pour cette unité.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/dashboard');
        }
    }, [profile, isAllowed, router]);
    
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

    useEffect(() => {
        if (activeCart?.customerUuid) {
            refreshSellCustomer();
        }
    }, [activeCart?.customerUuid, refreshSellCustomer]);

    const handleCustomerDialogSuccess = (newCustomer?: any) => {
        if (newCustomer) setCartCustomer(newCustomer);
        incrementCustomerListVersion();
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

    if (!profile || !isAllowed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    Vérification des Décrets...
                </p>
            </div>
        );
    }

    if (!activeCart) {
        return <div className="p-4"><Skeleton className="h-12 w-full mb-4" /><div className="grid grid-cols-3 gap-4 h-96"><Skeleton className="col-span-2"/><Skeleton /></div></div>;
    }
    
    return (
        <>
            <div className="h-full flex flex-col animate-in fade-in duration-500">
                <CartTotalBar cart={activeCart} customer={sellPage.cartCustomer} onPayDebtClick={() => toggleSellDebtPayment(true)} />
                
                <div className="grid md:grid-cols-3 gap-4 flex-grow min-h-0 p-4">
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                           <div className="flex items-center gap-2 flex-grow sm:max-w-md">
                                <div className="flex-grow"><CustomerCombobox ref={customerComboboxRef} listVersion={sellPage.customerListVersion} /></div>
                                <Button variant="outline" size="icon" onClick={() => toggleSellCustomerDialog(true)} className="rounded-xl luxury-glass border-white/10"><UserPlus className="h-4 w-4" /></Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <DraftsDropdown ref={draftsDropdownRef} />
                                
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 luxury-glass border-white/5 opacity-50 hover:opacity-100">
                                            <Keyboard className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="luxury-glass border-primary/20">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Keyboard className="h-5 w-5 text-primary" />
                                                Guide des Raccourcis Terminal
                                            </DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4 py-4">
                                            {[
                                                { k: 'F1 / F3', d: 'Recherche Produit' },
                                                { k: 'F2', d: 'Choix Client' },
                                                { k: 'F4', d: 'Mes Brouillons' },
                                                { k: 'F6', d: 'Focus Remise' },
                                                { k: 'F7', d: 'Type Remise (DA/%)' },
                                                { k: 'F8', d: 'Vider le Panier' },
                                                { k: 'F9', d: 'Payer & Finaliser' },
                                                { k: 'F10', d: 'Produit Perso' },
                                                { k: 'Entrée', d: 'Valider Action' },
                                                { k: 'Esc', d: 'Fermer Fenêtre' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                                                    <code className="bg-primary/20 text-primary px-2 py-0.5 rounded font-black text-[10px]">{item.k}</code>
                                                    <span className="text-xs font-bold">{item.d}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="md:hidden">
                                    <Sheet open={modals.isProductSheetOpen} onOpenChange={toggleSellProductSheet}>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" className="rounded-xl luxury-glass border-white/10"><PackageSearch className="mr-2 h-4 w-4" />Articles</Button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="p-0 w-full luxury-glass">
                                            <ProductSearch onProductSelect={addProductToCart} />
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        </div>

                        <Card className="flex-grow flex flex-col min-h-0 luxury-glass border-white/5 shadow-2xl overflow-hidden">
                            <CardContent className="p-4 sm:p-6 flex-grow flex flex-col min-h-0 overflow-hidden">
                                <CartDisplay cart={activeCart} />
                            </CardContent>
                            <CardFooter className="p-4 sm:p-6 mt-auto border-t bg-muted/10 border-white/5">
                                <SaleActions ref={saleActionsRef} />
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="hidden md:flex md:flex-col">
                        <Card className="h-full flex flex-col luxury-glass border-white/5 overflow-hidden">
                            <ProductSearch ref={productSearchRef} onProductSelect={addProductToCart} />
                        </Card>
                    </div>
                </div>
            </div>

            {sellPage.cartCustomer && <AddPaymentDialog isOpen={modals.isDebtPaymentDialogOpen} onOpenChange={toggleSellDebtPayment} customer={sellPage.cartCustomer} onPaymentSuccess={refreshSellCustomer} />}
            <CustomerDialog isOpen={modals.isCustomerDialogOpen} onOpenChange={toggleSellCustomerDialog} customer={null} onSuccess={handleCustomerDialogSuccess} />
            <PrintReceiptDialog />
        </>
    );
}
