'use client';

import type { Cart } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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

interface CartTabsProps {
    carts: Cart[];
    activeCartId: string;
    onTabChange: (id: string) => void;
    onAddCart: () => void;
    onRemoveCart: (id: string) => void;
}

export function CartTabs({ carts, activeCartId, onTabChange, onAddCart, onRemoveCart }: CartTabsProps) {

    const handleRemove = (e: React.MouseEvent, cartId: string) => {
        e.stopPropagation(); // Prevent tab selection
        onRemoveCart(cartId);
    };

    return (
        <div className="flex items-center gap-2">
            <ScrollArea className="w-full whitespace-nowrap">
                 <div className="flex items-center gap-1 pb-2">
                    {carts.map(cart => (
                        <div key={cart.id} className="relative inline-flex">
                            <Button
                                variant={activeCartId === cart.id ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => onTabChange(cart.id)}
                                className={cn("pr-8", cart.items.length > 0 && activeCartId !== cart.id && "font-bold text-primary")}
                            >
                                {cart.name}
                            </Button>
                            {carts.length > 1 && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1/2 right-0 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Supprimer le panier "{cart.name}" ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Êtes-vous sûr de vouloir supprimer ce panier ? Cette action est irréversible.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={(e) => handleRemove(e, cart.id)} className="bg-destructive hover:bg-destructive/90">
                                                Supprimer
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    ))}
                </div>
                 <ScrollBar orientation="horizontal" />
            </ScrollArea>
             <Button variant="outline" size="icon" onClick={onAddCart} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
