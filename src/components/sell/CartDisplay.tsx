'use client';

import type { Cart, CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';


interface CartDisplayProps {
    cart: Cart;
    onQuantityChange: (itemId: number | string, newQuantity: number) => void;
    onRemoveItem: (itemId: number | string) => void;
}

export function CartDisplay({ cart, onQuantityChange, onRemoveItem }: CartDisplayProps) {
    
    return (
        <CardContent className="p-4 sm:p-6 flex-grow flex flex-col min-h-0">
            {cart.items.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground luxury-glass p-8 rounded-2xl">
                    <ShoppingCart className="h-16 w-16 mb-4 text-primary/70" />
                    <h3 className="text-lg font-semibold">Le panier est vide</h3>
                    <p className="text-sm">Recherchez un produit pour commencer.</p>
                </div>
            ) : (
                <ScrollArea className="flex-grow -mr-4 pr-4">
                    <div className="space-y-3">
                        {cart.items.map(item => (
                            <div key={item.id} className={cn(
                                "flex items-center gap-4 bg-background/50 border border-white/5 p-2 rounded-xl transition-all duration-300", 
                                item.flash && "animate-flash ring-2 ring-primary/50"
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
                                        onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value, 10) || 0)}
                                        className="w-16 h-9 text-center"
                                        min="1"
                                        max={typeof item.id === 'number' ? item.quantity : undefined}
                                    />
                                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => onRemoveItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
    );
}
