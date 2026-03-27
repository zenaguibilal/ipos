'use client';

import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { ShoppingCart, User, Tag, Minus, HandCoins } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Cart, Customer } from '@/lib/types';

interface CartTotalBarProps {
  cart: Cart | undefined;
  customer: Customer | null;
  onPayDebtClick?: () => void;
}

export function CartTotalBar({ cart, customer, onPayDebtClick }: CartTotalBarProps) {

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
                            <User className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{customer.firstName} {customer.lastName}</span>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            
                             {customer.outstandingBalance > 0 ? (
                                <button onClick={onPayDebtClick} className="flex items-center gap-1.5 p-1 -m-1 rounded-md hover:bg-destructive/10 transition-colors">
                                    <span className="font-semibold text-destructive">
                                        Solde: {formatCurrency(customer.outstandingBalance)}
                                    </span>
                                    <HandCoins className="h-4 w-4 text-destructive/80" />
                                </button>
                            ) : (
                                <span className="font-semibold text-muted-foreground">
                                    Solde: {formatCurrency(customer.outstandingBalance)}
                                </span>
                            )}

                            {typeof customer.creditLimit === 'number' && (
                                <span className="font-semibold text-chart-quaternary">
                                    (Plafond: {formatCurrency(customer.creditLimit)})
                                </span>
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
                        <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
