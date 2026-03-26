
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function CartDisplay() {
    const cart = useAppStore((state) => state.cart);
    const { updateCartItemQuantity, removeCartItem, clearCartFlashes } = useAppActions();
    
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
                            <div key={item.uuid} className={cn(
                                "flex items-center gap-4 bg-background/50 border border-white/5 p-2 rounded-xl transition-all duration-300", 
                                item.flash && "animate-flash"
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
                                    <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Input
                                        type="number"
                                        value={item.cartQuantity}
                                        onChange={(e) => handleQuantityUpdate(item.uuid, e.target.value)}
                                        className="w-16 h-9 text-center"
                                        min="1"
                                        max={item.quantity}
                                    />
                                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => removeCartItem(item.uuid)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </>
    );
}
