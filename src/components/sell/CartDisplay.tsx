
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart, CalendarClock, Plus, Minus } from 'lucide-react';
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
        <div className="flex flex-col gap-1 mt-1">
            <span className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Prix Manuel</span>
            <Input
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="h-8 w-24 bg-background/50 border-primary/20 focus:border-primary font-bold"
                aria-label="Edit price"
            />
        </div>
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
            "flex items-center gap-4 border p-3 rounded-2xl transition-all duration-300 group",
            item.flash ? "animate-flash bg-primary/5 border-primary/30" : "bg-background/40 border-white/5",
            expirationStatus?.isExpired ? "bg-destructive/10 border-destructive/30" : "hover:border-primary/20"
        )}>
            <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <Image
                    src={item.imageUrl || getPlaceholder(item.category).url}
                    alt={item.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-bold text-sm uppercase truncate">{item.name}</p>
                {isManagerOrAdmin ? (
                    <PriceEditor item={item} onPriceChange={onPriceChange} />
                ) : (
                    <p className="text-xs font-black text-primary/80 mt-1">{formatCurrency(item.price)}</p>
                )}
                {expirationStatus && (
                    <Badge className={cn("mt-2 h-5 text-[9px] px-2", expirationStatus.color)}>
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {expirationStatus.text}
                    </Badge>
                )}
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onQuantityUpdate(item.uuid, String(item.cartQuantity - 1))}
                        disabled={item.cartQuantity <= 1}
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                        type="number"
                        value={item.cartQuantity}
                        onChange={(e) => onQuantityUpdate(item.uuid, e.target.value)}
                        className="w-12 h-8 text-center bg-transparent border-0 focus-visible:ring-0 font-black p-0"
                        min="1"
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => onQuantityUpdate(item.uuid, String(item.cartQuantity + 1))}
                        disabled={item.cartQuantity >= item.quantity}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" 
                    onClick={() => onRemove(item.uuid)}
                >
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
        <div className="flex flex-col h-full">
            {!cart || cart.items.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale p-8">
                    <div className="h-32 w-32 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
                        <ShoppingCart className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest">Panier Vide</h3>
                        <p className="text-xs font-medium uppercase tracking-tighter italic">En attente de scanning d'articles...</p>
                    </div>
                </div>
            ) : (
                <ScrollArea className="flex-grow -mr-4 pr-4">
                    <div className="space-y-3 pb-10">
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
        </div>
    );
}
