
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/lib/types";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemControlsProps {
    item: CartItem;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onRemoveItem: (productId: string) => void;
}

export function CartItemControls({ item, onUpdateQuantity, onRemoveItem }: CartItemControlsProps) {
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.cartQuantity - 1)}
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Input
                type="number"
                value={item.cartQuantity}
                onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                       onUpdateQuantity(item.id, value)
                    }
                }}
                className="h-8 w-12 text-center"
            />
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.cartQuantity + 1)}
            >
                <Plus className="h-4 w-4" />
            </Button>
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onRemoveItem(item.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
