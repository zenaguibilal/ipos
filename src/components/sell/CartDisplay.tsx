'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart, CalendarClock } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { toast } from 'sonner';
import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Cart, CartItem } from '@/lib/types';
import { differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Component to manage local state for price editing
const PriceEditor = ({ item, onPriceChange }: { item: CartItem, onPriceChange: (uuid: string, price: number) => void }) => {
    const [priceStr, setPriceStr] = useState(String(item.price));
    const debouncedPrice = useDebounce(parseFloat(priceStr), 500);

    // Update local state if the global state changes (e.g. cart cleared)
    useEffect(() => {
        setPriceStr(String(item.price));
    }, [item.price]);

    // Update global state when debounced local value changes
    useEffect(() => {
        if (!isNaN(debouncedPrice) && debouncedPrice >= 0 && debouncedPrice !== item.price) {
            onPriceChange(item.uuid, debouncedPrice);
        }
    }, [debouncedPrice, item.price, item.uuid, onPriceChange]);

    return (
        <Input
            type="number"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            className="h-8 w-24 mt-1"
            aria-label="Edit price"
        />
    )
}

const CartListItem = ({ item, isManagerOrAdmin, onQuantityUpdate, onPriceChange, onRemove }: { item: CartItem, isManagerOrAdmin: boolean, onQuantityUpdate: (uuid: string, qty: string) => void, onPriceChange: (uuid: string, price: number) => void, onRemove: (uuid: string) => void }) => {
    const expirationStatus = useMemo(() => {
        if (!item.dateExpiration) return null;
        const today = new Date();
        const expirationDate = new Date(item.dateExpiration);
        const daysUntilExpiration = differenceInDays(expirationDate, today);

        if (daysUntilExpiration < 0) return { color: 'bg-destructive text-destructive-foreground', text: `Expiré`, isExpired: true };
        if (daysUntilExpiration <= 30) return { color: 'bg-yellow-500 text-black', text: `Expire dans ${daysUntilExpiration} j`, isExpired: false };
        return null;
    }, [item.dateExpiration]);

    return (
        <div className={cn(
            "flex items-center gap-4 border p-2 rounded-xl transition-all duration-300",
            item.flash && "animate-flash",
            expirationStatus?.isExpired ? "bg-destructive/10 border-destructive/30" : "bg-background/50"
        )}>
            <Image
                src={item.imageUrl || getPlaceholder(item.category).url}
                alt={item.name}
                width={64}
                height={64}
                className="h-16 w-16 object-cover rounded-md"
            />
            <div className="flex-grow">
                <p className="font-semibold">{item.name}</p>
                {isManagerOrAdmin ? (
                    <PriceEditor item={item} onPriceChange={onPriceChange} />
                ) : (
                    <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                )}
                {expirationStatus && (
                    <Badge className={cn("mt-1.5", expirationStatus.color)}>
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {expirationStatus.text}
                    </Badge>
                )}
            </div>
            <div className="flex items-center gap-2">
                 <Input
                    type="number"
                    value={item.cartQuantity}
                    onChange={(e) => onQuantityUpdate(item.uuid, e.target.value)}
                    className="w-16 h-9 text-center"
                    min="1"
                    max={item.quantity}
                />
                <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => onRemove(item.uuid)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export function CartDisplay({ cart }: { cart: Cart | undefined }) {
    const { updateCartItemQuantity, removeCartItem, clearCartFlashes, updateCartItemPrice } = useAppActions();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    
    const handleQuantityUpdate = (itemUuid: string, newQuantity: string) => {
        const quantity = parseInt(newQuantity, 10);
        if (isNaN(quantity)) return;

        try {
            updateCartItemQuantity(itemUuid, quantity);
        } catch (error: any) {
            toast.error(error.message);
        }
    };
    
    useEffect(() => {
        const hasFlashedItems = cart?.items.some(item => item.flash);
        if (hasFlashedItems) {
            const timer = setTimeout(() => {
                clearCartFlashes();
            }, 500); // Duration of the flash animation
            return () => clearTimeout(timer);
        }
    }, [cart?.items, clearCartFlashes]);

    return (
        <>
            {!cart || cart.items.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground luxury-glass p-8 rounded-2xl">
                    <ShoppingCart className="h-16 w-16 mb-4 text-primary/70" />
                    <h3 className="text-lg font-semibold">Le panier est vide</h3>
                    <p className="text-sm">Recherchez un produit pour commencer.</p>
                </div>
            ) : (
                <ScrollArea className="flex-grow -mr-4 pr-4">
                    <div className="space-y-3">
                        {cart.items.map(item => (
                             <CartListItem
                                key={item.uuid}
                                item={item}
                                isManagerOrAdmin={isManagerOrAdmin}
                                onQuantityUpdate={handleQuantityUpdate}
                                onPriceChange={updateCartItemPrice}
                                onRemove={removeCartItem}
                            />
                        ))}
                    </div>
                </ScrollArea>
            )}
        </>
    );
}
