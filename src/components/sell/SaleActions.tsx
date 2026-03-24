

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Save, FolderOpen } from 'lucide-react';
import type { Cart, Customer } from '@/lib/types';
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
import { toast } from 'sonner';

interface SaleActionsProps {
    cart: Cart;
    customer: Customer | null | undefined;
    onClearCart: () => void;
    onSetDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
    onSaveDraft: () => void;
    onOpenDrafts: () => void;
    onSaleFinalized: () => void;
}

export const SaleActions = React.forwardRef<
    { payment: HTMLButtonElement, draft: HTMLButtonElement }, 
    SaleActionsProps
>(({ cart, customer, onClearCart, onSetDiscount, onSaveDraft, onOpenDrafts, onSaleFinalized }, ref) => {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const totalItems = cart.items.reduce((acc, item) => acc + item.cartQuantity, 0);
    const { subtotal, discountAmount, total } = calculateCartTotals(cart);
    
    const discountValue = cart.discount.value || 0;
    const discountType = cart.discount.type || 'fixed';

    const handleSaveDraft = () => {
        if (cart.items.length > 0) {
            onSaveDraft();
        } else {
            toast.info("Le panier est vide. Impossible de sauvegarder le brouillon.");
        }
    };
    
    const paymentButtonRef = React.useRef<HTMLButtonElement>(null);
    const draftButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => ({
        get payment() {
            return paymentButtonRef.current!;
        },
        get draft() {
            return draftButtonRef.current!;
        }
    }));


    return (
        <>
            <PaymentDialog 
                isOpen={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                cart={cart}
                customer={customer}
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
                            onChange={(e) => onSetDiscount({ type: discountType, value: parseFloat(e.target.value) })}
                            className="h-10 flex-grow"
                        />
                        <Button 
                            variant={discountType === 'fixed' ? 'secondary' : 'ghost'}
                            onClick={() => onSetDiscount({ type: 'fixed', value: discountValue })}
                        >DA</Button>
                        <Button 
                            variant={discountType === 'percentage' ? 'secondary' : 'ghost'}
                            onClick={() => onSetDiscount({ type: 'percentage', value: discountValue })}
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
                            <Button ref={draftButtonRef} variant="outline" className="flex-1" onClick={handleSaveDraft}>
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
                                <AlertDialogAction onClick={onClearCart} className="bg-destructive hover:bg-destructive/90">
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
