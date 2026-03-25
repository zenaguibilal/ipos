'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Save, FolderOpen } from 'lucide-react';
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
import { useCartStore, useCartActions } from '@/stores/cartStore';

interface SaleActionsProps {
    onSaleFinalized: () => void;
    onOpenDrafts: () => void;
}

export const SaleActions = React.forwardRef<
    { payment: () => void, draft: () => void }, 
    SaleActionsProps
>(({ onSaleFinalized, onOpenDrafts }, ref) => {
    const { cart } = useCartStore();
    const { clearCart, setCartDiscount, saveCartAsDraft } = useCartActions();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const totalItems = cart?.items.reduce((acc, item) => acc + item.cartQuantity, 0) || 0;
    const { subtotal, discountAmount, total } = cart ? calculateCartTotals(cart) : { subtotal: 0, discountAmount: 0, total: 0 };
    
    const discountValue = cart?.discount.value || 0;
    const discountType = cart?.discount.type || 'fixed';
    
    const paymentButtonRef = React.useRef<HTMLButtonElement>(null);
    const draftButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => ({
        payment: () => {
            if (paymentButtonRef.current) {
                paymentButtonRef.current.click();
            } else {
                 setIsPaymentOpen(true);
            }
        },
        draft: () => {
            draftButtonRef.current?.click();
        }
    }));

    if (!cart) return null;

    return (
        <>
            <PaymentDialog 
                isOpen={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                onSaleFinalized={onSaleFinalized}
            />
             <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Sous-total ({totalItems} articles)</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="space-y-2">
                    <Label>Remise</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="0"
                            value={discountValue || ''}
                            onChange={(e) => setCartDiscount({ type: discountType, value: parseFloat(e.target.value) || 0 })}
                            className="h-10 flex-grow"
                        />
                        <Button 
                            variant={discountType === 'fixed' ? 'secondary' : 'ghost'}
                            onClick={() => setCartDiscount({ type: 'fixed', value: discountValue })}
                        >DA</Button>
                        <Button 
                            variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                            onClick={() => setCartDiscount({ type: 'percentage', value: discountValue })}
                        >%</Button>
                    </div>
                </div>

                 {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-md text-destructive">
                        <span>Remise appliquée</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                )}
                 
                 <Separator className="my-4 bg-white/10" />

                 <div className="luxury-glass p-4">
                    <div className="flex justify-between items-center text-2xl font-bold text-primary">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <div className="flex gap-2">
                            <Button ref={draftButtonRef} variant="outline" className="flex-1" onClick={saveCartAsDraft}>
                                <Save className="mr-2 h-4 w-4" /> Brouillon (F4)
                            </Button>
                             <Button variant="outline" size="icon" onClick={onOpenDrafts}>
                                <FolderOpen className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="lg" disabled={cart.items.length === 0}>
                                <Trash2 className="mr-2 h-5 w-5" /> Vider
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
                </div>
                 <Button 
                    ref={paymentButtonRef}
                    size="lg" 
                    className="w-full text-lg py-6"
                    disabled={cart.items.length === 0}
                    onClick={() => setIsPaymentOpen(true)}
                >
                    Payer (F9)
                </Button>
            </div>
        </>
    );
});
SaleActions.displayName = 'SaleActions';
