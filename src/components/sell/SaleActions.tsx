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

interface SaleActionsProps {
    cart: Cart;
    onClearCart: () => void;
}

export function SaleActions({ cart, onClearCart }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
    const totalItems = cart.items.reduce((acc, item) => acc + item.cartQuantity, 0);

    const handleSaleFinalized = () => {
        // The dialog will stay open to show receipt.
        // We clear the cart in the background.
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
                    <span>{subtotal.toFixed(1)} DA</span>
                </div>
                 <div className="flex justify-between items-center text-2xl font-bold text-primary">
                    <span>Total</span>
                    <span>{subtotal.toFixed(1)} DA</span>
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
