
'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Cart, Product, Customer, CartItem } from '@/lib/types';
import { toast } from 'sonner';

const createNewCart = (name: string): Cart => ({
  id: uuidv4(),
  name,
  items: [],
  customerId: null,
  customerName: '',
  discount: { type: 'fixed', value: 0 },
});

export const useCarts = () => {
    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartIdState] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initialCarts = [createNewCart('Panier 1')];
        setCarts(initialCarts);
        setActiveCartIdState(initialCarts[0].id);
        setIsLoading(false);
    }, []);

    const activeCart = carts.find(c => c.id === activeCartId);

    const setActiveCartId = useCallback((id: string) => {
        setActiveCartIdState(id);
    }, []);

    const addCart = useCallback(() => {
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        setCarts(prev => [...prev, newCart]);
        setActiveCartId(newCart.id);
        toast.info(`Nouveau panier "${newCart.name}" créé.`);
    }, [carts, setActiveCartId]);

    const removeCart = useCallback((cartId: string) => {
        if (carts.length <= 1) {
            toast.warning("Impossible de supprimer le dernier panier.");
            return;
        }
        const remainingCarts = carts.filter(c => c.id !== cartId);
        setCarts(remainingCarts);
        if (activeCartId === cartId) {
            setActiveCartId(remainingCarts[0].id);
        }
    }, [carts, activeCartId, setActiveCartId]);
    
    const addProductToCart = useCallback((product: Product, quantity: number) => {
        if (!activeCartId) return;

        setCarts(prevCarts => {
            return prevCarts.map(cart => {
                if (cart.id !== activeCartId) return cart;

                const existingItem = cart.items.find(item => item.id === product.id);
                let newItems: CartItem[];

                if (existingItem) {
                    newItems = cart.items.map(item =>
                        item.id === product.id
                            ? { ...item, cartQuantity: item.cartQuantity + quantity, flash: true }
                            : { ...item, flash: false }
                    );
                } else {
                    const newCartItem: CartItem = {
                        ...product,
                        cartQuantity: quantity,
                        flash: true,
                    };
                    newItems = [...cart.items.map(i => ({...i, flash: false})), newCartItem];
                }
                return { ...cart, items: newItems };
            });
        });
        
        setTimeout(() => {
             setCarts(prevCarts => 
                 prevCarts.map(cart => 
                    cart.id === activeCartId 
                    ? { ...cart, items: cart.items.map(i => ({ ...i, flash: false })) }
                    : cart
                )
            );
        }, 500);

    }, [activeCartId]);

    const updateCartItemQuantity = useCallback((itemId: number | string, newQuantity: number) => {
        if (!activeCartId) return;
        
        setCarts(prevCarts => {
            return prevCarts.map(cart => {
                if (cart.id !== activeCartId) return cart;
                
                const updatedItems = cart.items
                    .map(item => item.id === itemId ? { ...item, cartQuantity: newQuantity } : item)
                    .filter(item => item.cartQuantity > 0);

                return { ...cart, items: updatedItems };
            });
        });

    }, [activeCartId]);

    const removeCartItem = useCallback((itemId: number | string) => {
        if (!activeCartId) return;
        setCarts(prevCarts => {
            return prevCarts.map(cart => {
                if (cart.id !== activeCartId) return cart;
                return { ...cart, items: cart.items.filter(item => item.id !== itemId) };
            });
        });
    }, [activeCartId]);

    const clearCart = useCallback(() => {
        if (!activeCartId) return;
        setCarts(prev => prev.map(c => c.id === activeCartId ? { ...c, items: [], customerId: null, customerName: '', discount: { type: 'fixed', value: 0 } } : c));
        toast.info("Le panier a été vidé.");
    }, [activeCartId]);

    const setCartCustomer = useCallback((customer: Customer | null) => {
        if (!activeCartId) return;
        setCarts(prevCarts => {
            return prevCarts.map(cart => {
                if (cart.id !== activeCartId) return cart;
                return { 
                    ...cart, 
                    customerId: customer?.id || null, 
                    customerName: customer ? `${customer.firstName} ${customer.lastName}` : '' 
                };
            });
        });
    }, [activeCartId]);

    const setCartDiscount = useCallback((discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCartId) return;
        setCarts(prevCarts => {
            return prevCarts.map(cart => {
                if (cart.id !== activeCartId) return cart;
                return { ...cart, discount };
            });
        });
    }, [activeCartId]);

    return {
        carts: carts,
        activeCartId: activeCartId,
        activeCart,
        setActiveCartId,
        addCart,
        removeCart,
        addProductToCart,
        clearCart,
        updateCartItemQuantity,
        removeCartItem,
        setCartCustomer,
        setCartDiscount,
        isLoading,
    };
};
