'use client';

import { useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Cart, Product, Customer } from '@/lib/types';
import { toast } from 'sonner';
import { cartService, draftService } from '@/services';

export const CART_ID = 'default-cart';

export const useCart = () => {
    const cart = useLiveQuery(() => db.carts.get(CART_ID), []);
    const isLoading = cart === undefined;

    useEffect(() => {
        cartService.initCart();
    }, []);

    const addProductToCart = useCallback((product: Product, quantity: number) => {
        cartService.addProductToCart(CART_ID, product, quantity);
    }, []);

    const updateCartItemQuantity = useCallback((itemId: number | string, newQuantity: number) => {
        cartService.updateCartItemQuantity(CART_ID, itemId, newQuantity).then(result => {
            if (result.capped) {
                toast.warning(`La quantité a été limitée à ${result.maxQuantity} (stock disponible).`);
            }
        });
    }, []);

    const removeCartItem = useCallback((itemId: number | string) => {
        cartService.removeCartItem(CART_ID, itemId);
    }, []);

    const clearCart = useCallback(() => {
        cartService.clearCart(CART_ID);
        toast.info("Le panier a été vidé.");
    }, []);

    const setCartCustomer = useCallback((customer: Customer | null) => {
        cartService.setCartCustomer(CART_ID, customer);
    }, []);

    const setCartDiscount = useCallback((discount: { type: 'fixed' | 'percentage'; value: number }) => {
        cartService.setCartDiscount(CART_ID, discount);
    }, []);
    
    const saveCartAsDraft = useCallback(async () => {
        if (!cart) return;
        await draftService.saveCartAsDraft(cart);
    }, [cart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        await draftService.loadDraftToCart(draftId, CART_ID);
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
