
'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Cart } from '@/lib/types';

const CARTS_STORAGE_KEY = 'iPOS_carts';

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

    useEffect(() => {
        try {
            const storedCarts = localStorage.getItem(CARTS_STORAGE_KEY);
            if (storedCarts) {
                const parsedCarts = JSON.parse(storedCarts);
                if (Array.isArray(parsedCarts) && parsedCarts.length > 0) {
                    setCarts(parsedCarts);
                    setActiveCartId(parsedCarts[0].id);
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to load carts from localStorage", error);
        }
        // If no valid stored carts, create a default one
        const defaultCart = createNewCart('Panier 1');
        setCarts([defaultCart]);
        setActiveCartId(defaultCart.id);
    }, []);

    useEffect(() => {
        try {
            if (carts.length > 0) {
                localStorage.setItem(CARTS_STORAGE_KEY, JSON.stringify(carts));
            } else {
                localStorage.removeItem(CARTS_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Failed to save carts to localStorage", error);
        }
    }, [carts]);

    const addCart = useCallback(() => {
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
        updateCart({
            ...carts.find(c => c.id === cartId)!,
            items: [],
            customerId: null,
            customerName: 'Vente au comptoir',
            discount: { type: 'fixed', value: 0 },
        });
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
