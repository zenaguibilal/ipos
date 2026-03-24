'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import type { Cart, Product, Customer } from '@/lib/types';
import { toast } from 'sonner';

export const CART_ID = 'default-cart';

const createNewCart = (): Cart => ({
  id: CART_ID,
  name: 'Panier Principal',
  items: [],
  customerId: null,
  customerName: '',
  discount: { type: 'fixed', value: 0 },
});

export const useCart = () => {
    const cart = useLiveQuery(() => db.carts.get(CART_ID), []);
    const isLoading = cart === undefined;

    useEffect(() => {
        // Initialize the cart if it doesn't exist in the database
        const checkAndCreateCart = async () => {
            const existingCart = await db.carts.get(CART_ID);
            if (!existingCart) {
                await dataService.addCart(createNewCart());
            }
        };
        checkAndCreateCart();
    }, []);

    const addProductToCart = useCallback((product: Product, quantity: number) => {
        dataService.addProductToCart(CART_ID, product, quantity);
    }, []);

    const updateCartItemQuantity = useCallback((itemId: number | string, newQuantity: number) => {
        dataService.updateCartItemQuantity(CART_ID, itemId, newQuantity).then(result => {
            if (result.capped) {
                toast.warning(`La quantité a été limitée à ${result.maxQuantity} (stock disponible).`);
            }
        });
    }, []);

    const removeCartItem = useCallback((itemId: number | string) => {
        dataService.removeCartItem(CART_ID, itemId);
    }, []);

    const clearCart = useCallback(() => {
        dataService.clearCart(CART_ID);
        toast.info("Le panier a été vidé.");
    }, []);

    const setCartCustomer = useCallback((customer: Customer | null) => {
        dataService.setCartCustomer(CART_ID, customer);
    }, []);

    const setCartDiscount = useCallback((discount: { type: 'fixed' | 'percentage'; value: number }) => {
        dataService.setCartDiscount(CART_ID, discount);
    }, []);
    
    const saveCartAsDraft = useCallback(async () => {
        if (!cart) return;
        await dataService.saveCartAsDraft(cart);
    }, [cart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        await dataService.loadDraftToCart(draftId, CART_ID);
    }, []);

    return {
        cart,
        isLoading,
        addProductToCart,
        clearCart,
        updateCartItemQuantity,
        removeCartItem,
        setCartCustomer,
        setCartDiscount,
        saveCartAsDraft,
        loadDraftToCart,
    };
};
