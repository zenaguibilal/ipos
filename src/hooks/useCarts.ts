'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Cart } from '@/lib/types';

const createNewCart = (name: string): Cart => ({
    id: uuidv4(),
    name,
    items: [],
    customerId: null,
    customerName: 'Vente au comptoir',
    discount: { type: 'fixed', value: 0 },
});

export function useCarts() {
    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartId] = useState<string>('');

    // Initialize with one default cart
    useEffect(() => {
        const defaultCart = createNewCart('Panier 1');
        setCarts([defaultCart]);
        setActiveCartId(defaultCart.id);
    }, []);

    const addCart = useCallback(() => {
        if (carts.length >= 5) {
            // Optional: Limit the number of carts
            return;
        }
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        setCarts(prev => [...prev, newCart]);
        setActiveCartId(newCart.id);
    }, [carts.length]);

    const removeCart = useCallback((cartId: string) => {
        if (carts.length <= 1) return; // Can't remove the last cart

        setCarts(prev => {
            const newCarts = prev.filter(c => c.id !== cartId);
            if (activeCartId === cartId) {
                setActiveCartId(newCarts[0]?.id || '');
            }
            return newCarts;
        });
    }, [carts.length, activeCartId]);

    const updateCart = useCallback((updatedCart: Cart) => {
        setCarts(prev => prev.map(c => c.id === updatedCart.id ? updatedCart : c));
    }, []);
    
    const clearCart = useCallback((cartId: string) => {
        const cartToClear = carts.find(c => c.id === cartId);
        if(cartToClear) {
            updateCart({
                ...cartToClear,
                items: [],
                customerId: null,
                customerName: 'Vente au comptoir',
                discount: { type: 'fixed', value: 0 },
            });
        }
    }, [carts, updateCart]);

    return {
        carts,
        activeCartId,
        addCart,
        removeCart,
        setActiveCartId,
        updateCart,
        clearCart,
    };
}
