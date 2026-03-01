'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CreditCard } from 'lucide-react';
import type { Cart } from '@/lib/types';
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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '@/lib/utils';

interface SaleActionsProps {
    cart: Cart;
    onClearCart: () => void;
    onSetDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
}

export function SaleActions({ cart, onClearCart, onSetDiscount }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
    const totalItems = cart.items.reduce((acc, item) => acc + item.cartQuantity, 0);
    
    const discountValue = cart.discount.value || 0;
    const discountType = cart.discount.type || 'fixed';

    const discountAmount = discountType === 'percentage'
        ? (subtotal * discountValue) / 100
        : discountValue;
    
    const total = Math.max(0, subtotal - discountAmount);


    const handleSaleFinalized = () => {
        onClearCart();
    }

    return (
        <>
            <PaymentDialog 
                isOpen={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                cart={cart}
                onSaleFinalized={handleSaleFinalized}
            />
             <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Sous-total ({totalItems} articles)</span>
                    <span>{formatCurrency(subtotal)}</span>
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
                            variant={discountType === 'fixed' ? 'secondary' : 'outline'}
                            onClick={() => onSetDiscount({ type: 'fixed', value: discountValue })}
                        >DA</Button>
                        <Button 
                            variant={discountType === 'percentage' ? 'secondary' : 'outline'}
                            onClick={() => onSetDiscount({ type: 'percentage', value: discountValue })}
                        >%</Button>
                    </div>
                </div>

                 {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-md text-destructive">
                        <span>Remise</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                )}
                 
                 <div className="flex justify-between items-center text-2xl font-bold text-primary border-t pt-3 mt-3">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                 <div className="grid grid-cols-2 gap-2 pt-2">
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

                    <Button 
                        size="lg" 
                        disabled={cart.items.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                    >
                        <CreditCard className="mr-2 h-5 w-5" /> Payer
                    </Button>
                </div>
            </div>
        </>
    );
}
