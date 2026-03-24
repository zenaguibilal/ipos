
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
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
    const carts = useLiveQuery(() => db.carts.toArray());
    const [activeCartId, setActiveCartIdState] = useState<string>('');
    
    useEffect(() => {
        if (carts && carts.length > 0) {
            if (!activeCartId || !carts.some(c => c.id === activeCartId)) {
                setActiveCartIdState(carts[0].id);
            }
        } else if (carts && carts.length === 0) {
            // Initialize first cart
            const firstCart = createNewCart('Panier 1');
            dataService.addCart(firstCart);
        }
    }, [carts, activeCartId]);

    const activeCart = carts?.find(c => c.id === activeCartId);
    const isLoading = carts === undefined;

    const setActiveCartId = useCallback((id: string) => {
        setActiveCartIdState(id);
    }, []);

    const addCart = useCallback(() => {
        if (!carts) return;
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        dataService.addCart(newCart).then(() => {
            setActiveCartId(newCart.id);
            toast.info(`Nouveau panier "${newCart.name}" créé.`);
        });
    }, [carts, setActiveCartId]);

    const removeCart = useCallback((cartId: string) => {
        if (!carts || carts.length <= 1) {
            toast.warning("Impossible de supprimer le dernier panier.");
            return;
        }

        // If we're deleting the active cart, switch to another one first.
        if (activeCartId === cartId) {
            const newActiveCart = carts.find(c => c.id !== cartId);
            if (newActiveCart) {
                setActiveCartId(newActiveCart.id);
            }
        }
        
        // Now delete the cart from the DB
        dataService.removeCart(cartId).catch((err) => {
            toast.error(err.message || "Erreur lors de la suppression du panier.");
        });
    }, [carts, activeCartId, setActiveCartId]);
    
    const addProductToCart = useCallback((product: Product, quantity: number) => {
        if (!activeCartId) return;
        dataService.addProductToCart(activeCartId, product, quantity);
    }, [activeCartId]);

    const updateCartItemQuantity = useCallback((itemId: number | string, newQuantity: number) => {
        if (!activeCartId) return;
        dataService.updateCartItemQuantity(activeCartId, itemId, newQuantity).then(result => {
            if (result.capped) {
                toast.warning(`La quantité a été limitée à ${result.maxQuantity} (stock disponible).`);
            }
        });
    }, [activeCartId]);

    const removeCartItem = useCallback((itemId: number | string) => {
        if (!activeCartId) return;
        dataService.removeCartItem(activeCartId, itemId);
    }, [activeCartId]);

    const clearCart = useCallback(() => {
        if (!activeCartId) return;
        dataService.clearCart(activeCartId);
        toast.info("Le panier a été vidé.");
    }, [activeCartId]);

    const setCartCustomer = useCallback((customer: Customer | null) => {
        if (!activeCartId) return;
        dataService.setCartCustomer(activeCartId, customer);
    }, [activeCartId]);

    const setCartDiscount = useCallback((discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCartId) return;
        dataService.setCartDiscount(activeCartId, discount);
    }, [activeCartId]);
    
    const saveActiveCartAsDraft = useCallback(async () => {
        if (!activeCart) return;
        await dataService.saveCartAsDraft(activeCart);
    }, [activeCart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        if (!activeCartId) return;
        await dataService.loadDraftToCart(draftId, activeCartId);
    }, [activeCartId]);

    return {
        carts: carts || [],
        activeCartId,
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
        isLoading,
    };
};
