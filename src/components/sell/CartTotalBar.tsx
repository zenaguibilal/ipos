'use client';

import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { ShoppingCart, User, Tag, Minus } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

export function CartTotalBar() {
    const { cart, cartCustomer: customer } = useAppStore();

    if (!cart) {
        return (
             <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-primary/20 p-3 shadow-md print-hide">
                <div className="mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm px-4">
                </div>
            </div>
        );
    }

    const { subtotal, discountAmount, total } = calculateCartTotals(cart);
    const totalItems = cart.items.reduce((acc, item) => acc + item.cartQuantity, 0);

    return (
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-primary/20 p-3 shadow-md print-hide">
            <div className="mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm px-4">
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{totalItems} article(s)</span>
                    </div>
                    {customer && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-5 w-5" />
                            <span className="font-semibold">{customer.firstName} {customer.lastName}</span>
                            {customer.outstandingBalance > 0 && (
                                <span className="text-destructive font-bold"> (Dette: {formatCurrency(customer.outstandingBalance)})</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                    {discountAmount > 0 && (
                        <>
                           <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag className="h-4 w-4" />
                                <span>Sous-total: {formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-destructive">
                                <Minus className="h-4 w-4" />
                                <span>Remise: {formatCurrency(discountAmount)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-medium text-foreground">Total:</span>
                        <span className="text-2xl font-bold text-primary orange-glow">{formatCurrency(total)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
