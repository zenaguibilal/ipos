'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Cart } from '@/lib/types';
import { toast } from 'sonner';

const createNewCart = (name: string): Cart => ({
    id: uuidv4(),
    name,
    items: [],
    customerId: null,
    customerName: 'Vente au comptoir',
    discount: { type: 'fixed', value: 0 },
});

export function useCarts() {
    const carts = useLiveQuery(() => db.carts.toArray(), []);
    const [activeCartId, setActiveCartId] = useState<string | null>(null);

    // Effect to initialize carts in the database if it's empty
    useEffect(() => {
        const initializeCarts = async () => {
            const count = await db.carts.count();
            if (count === 0) {
                const defaultCart = createNewCart('Panier 1');
                await db.carts.add(defaultCart);
            }
        };
        initializeCarts();
    }, []);

    // Effect to set the active cart ID
    useEffect(() => {
        if (carts && carts.length > 0) {
            // If the active cart ID is not set or no longer valid, set it to the first cart
            const activeCartExists = carts.some(c => c.id === activeCartId);
            if (!activeCartId || !activeCartExists) {
                setActiveCartId(carts[0].id);
            }
        } else if (carts && carts.length === 0) {
            // If all carts are removed
            setActiveCartId(null);
        }
    }, [carts, activeCartId]);

    const addCart = useCallback(async () => {
        if (!carts) return;
        if (carts.length >= 5) {
            toast.warning("Vous ne pouvez pas avoir plus de 5 paniers ouverts.");
            return;
        }
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        await db.carts.add(newCart);
        setActiveCartId(newCart.id);
    }, [carts]);

    const removeCart = useCallback(async (cartId: string) => {
        if (!carts || carts.length <= 1) {
            toast.error("Vous ne pouvez pas supprimer le dernier panier.");
            return;
        }
        await db.carts.delete(cartId);
    }, [carts]);

    const updateCart = useCallback(async (updatedCart: Cart) => {
        await db.carts.put(updatedCart);
    }, []);
    
    const clearCart = useCallback(async (cartId: string) => {
        const cartToClear = carts?.find(c => c.id === cartId);
        if(cartToClear) {
            const clearedCart = {
                ...cartToClear,
                items: [],
                customerId: null,
                customerName: 'Vente au comptoir',
                discount: { type: 'fixed', value: 0 },
            };
            await db.carts.put(clearedCart);
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
