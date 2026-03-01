'use client';

import React from 'react';
import type { Cart, CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { cn } from '@/lib/utils';

interface CartDisplayProps {
    cart: Cart;
    onQuantityChange: (itemId: number | string, newQuantity: number) => void;
    onRemoveItem: (itemId: number | string) => void;
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;
const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) {
        return placeholders[category];
    }
    return placeholders.default;
};


export function CartDisplay({ cart, onQuantityChange, onRemoveItem }: CartDisplayProps) {
    
    const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>, item: CartItem) => {
        const newQuantity = parseInt(e.target.value, 10);
        if (isNaN(newQuantity) || newQuantity <= 0) {
            onQuantityChange(item.id, item.cartQuantity); // Revert to old quantity
        }
    };

    return (
        <div className="flex-grow flex flex-col min-h-0">
            {cart.items.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <ShoppingCart className="h-16 w-16 mb-4" />
                    <h3 className="text-lg font-semibold">Le panier est vide</h3>
                    <p className="text-sm">Recherchez un produit pour commencer.</p>
                </div>
            ) : (
                <ScrollArea className="flex-grow -mr-4 pr-4">
                    <div className="space-y-3">
                        {cart.items.map(item => (
                            <div key={item.id} className={cn("flex items-center gap-4 bg-muted/50 p-2 rounded-lg", item.flash && "animate-flash")}>
                                <Image 
                                    src={item.imageUrl || getPlaceholder(item.category).url}
                                    alt={item.name}
                                    width={64}
                                    height={64}
                                    className="h-16 w-16 object-cover rounded-md"
                                />
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.price.toFixed(1)} DA</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Input
                                        type="number"
                                        value={item.cartQuantity}
                                        onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value, 10) || 0)}
                                        onBlur={(e) => handleQuantityBlur(e, item)}
                                        className="w-16 h-9 text-center"
                                        min="1"
                                        max={typeof item.id === 'number' ? item.quantity : undefined}
                                    />
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
