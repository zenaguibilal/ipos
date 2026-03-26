
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
import { formatCurrency, calculateCartTotals } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { customerService } from '@/services/customer.service';

export const SaleActions = React.forwardRef<
    { 
        payment: () => void;
        focusDiscount: () => void;
        toggleDiscountType: () => void;
        clearCart: () => void;
    }, 
    {}
>(({}, ref) => {
    const { carts, activeCartId } = useAppStore();
    const { clearCart, setCartDiscount } = useAppActions();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const [cartCustomer, setCartCustomer] = React.useState(null);

    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);

    React.useEffect(() => {
        if (activeCart?.customerUuid) {
            customerService.getCustomerByUuid(activeCart.customerUuid).then(setCartCustomer);
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
            if (paymentButtonRef.current) {
                paymentButtonRef.current.click();
            } else {
                 setIsPaymentOpen(true);
            }
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
                isOpen={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                cart={activeCart}
                cartCustomer={cartCustomer}
            />
             <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Sous-total ({totalItems} articles)</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="discount-input">Remise (F6) / Type (F7)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="discount-input"
                            ref={discountInputRef}
                            type="number"
                            placeholder="0"
                            value={discountValue || ''}
                            onChange={(e) => setCartDiscount({ type: discountType, value: parseFloat(e.target.value) || 0 })}
                            className="h-10 flex-grow"
                        />
                        <Button 
                            variant={discountType === 'fixed' ? 'secondary' : 'ghost'}
                            onClick={() => setCartDiscount({ type: 'fixed', value: discountValue })}
                            type="button"
                        >DA</Button>
                        <Button 
                            variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                            onClick={() => setCartDiscount({ type: 'percentage', value: discountValue })}
                            type="button"
                        >%</Button>
                    </div>
                </div>

                 {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-md text-destructive">
                        <span>Remise appliquée</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                )}
                 
                 <Separator className="my-4" />

                 <div className="luxury-glass p-4">
                    <div className="flex justify-between items-center text-2xl font-bold text-primary">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button ref={clearCartTriggerRef} variant="destructive" size="lg" disabled={activeCart.items.length === 0}>
                                <Trash2 className="mr-2 h-5 w-5" /> Vider (F8)
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action supprimera tous les articles du panier actuel.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={clearCart} className="bg-destructive hover:bg-destructive/90">
                                    Confirmer et vider
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button 
                        ref={paymentButtonRef}
                        size="lg" 
                        className="w-full text-lg py-6"
                        disabled={activeCart.items.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                    >
                        Payer (F9)
                    </Button>
                </div>
            </div>
        </>
    );
});
SaleActions.displayName = 'SaleActions';
