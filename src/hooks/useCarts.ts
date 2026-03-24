
'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '@/services/data-service';
import type { Cart, Product, Customer } from '@/lib/types';
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
    const [carts, setCarts] = useState<Cart[]>(() => [createNewCart('Panier 1')]);
    const [activeCartId, setActiveCartIdState] = useState<string>(carts[0].id);

    const activeCart = carts.find(c => c.id === activeCartId);

    const setActiveCartId = useCallback((id: string) => {
        setActiveCartIdState(id);
    }, []);

    const addCart = useCallback(() => {
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        setCarts(prev => [...prev, newCart]);
        setActiveCartId(newCart.id);
        toast.info(`Nouveau panier "${newCart.name}" créé localement.`);
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
    
    const notify = () => toast.error("Fonctionnalité désactivée", { description: "La base de données a été supprimée." });

    const addProductToCart = () => notify();
    const updateCartItemQuantity = () => notify();
    const removeCartItem = () => notify();
    
    const clearCart = () => {
         if (!activeCartId) return;
         setCarts(prev => prev.map(c => c.id === activeCartId ? { ...c, items: [], customerId: null, customerName: '', discount: { type: 'fixed', value: 0 } } : c));
         toast.info("Le panier a été vidé localement.");
    };

    const setCartCustomer = () => notify();
    const setCartDiscount = () => notify();
    const saveActiveCartAsDraft = () => notify();
    const loadDraftToCart = () => notify();

    return {
        carts: carts ?? [],
        activeCartId: activeCartId || '',
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
        saveActiveCartAsDraft,
        loadDraftToCart,
        isLoading: !activeCart,
    };
};
