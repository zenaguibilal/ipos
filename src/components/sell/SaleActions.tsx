
'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, HandCoins, AlertTriangle, Zap, Minus } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, calculateCartTotals, cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import type { Customer } from '@/lib/types';

export const SaleActions = React.forwardRef<
    { 
        payment: () => void;
        focusDiscount: () => void;
        toggleDiscountType: () => void;
        clearCart: () => void;
    }, 
    {}
>(({}, ref) => {
    const { carts, activeCartId, modals } = useAppStore();
    const { clearCart, setCartDiscount, toggleSellPaymentDialog } = useAppActions();
    
    const [cartCustomer, setCartCustomer] = React.useState<Customer | null>(null);

    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    React.useEffect(() => {
        if (activeCart?.customerUuid) {
            api.get<Customer>(`customers/${activeCart.customerUuid}`).then(setCartCustomer).catch(() => setCartCustomer(null));
        } else {
            setCartCustomer(null);
        }
    }, [activeCart?.customerUuid]);


    const totalItems = activeCart?.items.reduce((acc, item) => acc + item.cartQuantity, 0) || 0;
    const { subtotal, discountAmount, total } = activeCart ? calculateCartTotals(activeCart) : { subtotal: 0, discountAmount: 0, total: 0 };
    
    const discountValue = activeCart?.discount.value || 0;
    const discountType = activeCart?.discount.type || 'fixed';
    
    const paymentButtonRef = React.useRef<HTMLButtonElement>(null);
    const discountInputRef = React.useRef<HTMLInputElement>(null);
    const clearCartTriggerRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => ({
        payment: () => {
            if (activeCart?.items.length! > 0) toggleSellPaymentDialog(true);
        },
        focusDiscount: () => {
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
        },
        toggleDiscountType: () => {
            const newType = discountType === 'fixed' ? 'percentage' : 'fixed';
            setCartDiscount({ type: newType, value: discountValue });
        },
        clearCart: () => {
            clearCartTriggerRef.current?.click();
        },
    }));

    if (!activeCart) return null;

    return (
        <>
            <PaymentDialog 
                isOpen={modals.sell.isPaymentDialogOpen}
                onOpenChange={toggleSellPaymentDialog}
                cart={activeCart}
                cartCustomer={cartCustomer}
            />
             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Discount Controls */}
                    <div className="flex-grow space-y-3">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="discount-input" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Appliquer Remise (F6/F7)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow group">
                                <Minus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive/40 group-focus-within:text-destructive transition-colors" />
                                <Input
                                    id="discount-input"
                                    ref={discountInputRef}
                                    type="number"
                                    placeholder="0"
                                    value={discountValue || ''}
                                    onChange={(e) => setCartDiscount({ type: discountType, value: parseFloat(e.target.value) || 0 })}
                                    className="h-12 pl-10 rounded-xl bg-background/40 border-white/5 focus:border-destructive/40 font-bold"
                                />
                            </div>
                            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                                <Button 
                                    variant={discountType === 'fixed' ? 'secondary' : 'ghost'}
                                    onClick={() => setCartDiscount({ type: 'fixed', value: discountValue })}
                                    type="button"
                                    className="h-10 rounded-lg text-[10px] font-black uppercase"
                                >DA</Button>
                                <Button 
                                    variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                                    onClick={() => setCartDiscount({ type: 'percentage', value: discountValue })}
                                    type="button"
                                    className="h-10 rounded-lg text-[10px] font-black uppercase"
                                >%</Button>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="w-full sm:w-64 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground uppercase font-bold tracking-tighter">Sous-total ({totalItems})</span>
                            <span className="font-bold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-destructive">
                            <span className="uppercase font-bold tracking-tighter">Total Remises</span>
                            <span className="font-black">-{formatCurrency(discountAmount)}</span>
                        </div>
                        <Separator className="bg-white/5 my-2" />
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Net à Payer</span>
                            <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button ref={clearCartTriggerRef} variant="ghost" size="lg" disabled={activeCart.items.length === 0} className="rounded-2xl font-black uppercase text-[11px] tracking-widest text-destructive hover:bg-destructive/10 h-14 transition-all">
                                <Trash2 className="mr-3 h-5 w-5" /> Vider le Panier (F8)
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="luxury-glass border-destructive/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Voulez-vous tout annuler ?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-bold opacity-70 uppercase tracking-tighter">
                                    Cette action est irréversible et supprimera tous les articles de la vente en cours.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Non, continuer la vente</AlertDialogCancel>
                                <AlertDialogAction onClick={clearCart} className="bg-destructive hover:bg-destructive/90 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                    Confirmer l'annulation
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button 
                        ref={paymentButtonRef}
                        size="lg" 
                        className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
                        disabled={activeCart.items.length === 0}
                        onClick={() => toggleSellPaymentDialog(true)}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <Zap className="h-5 w-5 text-yellow-400 group-hover:animate-pulse" />
                            Passer au Règlement (F9)
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:scale-105 transition-transform duration-500" />
                    </Button>
                </div>
            </div>
        </>
    );
});
SaleActions.displayName = 'SaleActions';
