'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '@/services/data-service';
import type { Cart, Product, CartItem, Customer } from '@/lib/types';
import { toast } from 'sonner';

const CARTS_KEY = 'all-carts';

const createNewCart = (name: string): Cart => ({
  id: uuidv4(),
  name,
  items: [],
  customerId: null,
  customerName: '',
  discount: { type: 'fixed', value: 0 },
});

export const useCarts = () => {
    const { mutate } = useSWRConfig();
    const { data: carts = [], error, isLoading } = useSWR(CARTS_KEY, () => dataService.getAll<Cart>('carts'));
    const [activeCartId, setActiveCartId] = useState<string | null>(null);

    useEffect(() => {
        const initializeCarts = async () => {
            const storedCarts = await dataService.getAll<Cart>('carts');
            const lastActiveId = localStorage.getItem('active_cart_id');
            
            if (storedCarts.length > 0) {
                 mutate(CARTS_KEY, storedCarts, false);
                 setActiveCartId(lastActiveId && storedCarts.some(c => c.id === lastActiveId) ? lastActiveId : storedCarts[0].id);
            } else {
                const newCart = createNewCart('Panier 1');
                await dataService.save('carts', newCart);
                mutate(CARTS_KEY, [newCart], false);
                setActiveCartId(newCart.id);
            }
        };
        initializeCarts();
    }, [mutate]);
    
    useEffect(() => {
        if (activeCartId) {
            localStorage.setItem('active_cart_id', activeCartId);
        }
    }, [activeCartId]);

    const activeCart = carts.find(c => c.id === activeCartId);

    const saveCart = useCallback(async (cart: Cart) => {
        await dataService.update('carts', cart.id as string, cart);
        mutate(CARTS_KEY, (currentCarts: Cart[] = []) => 
            currentCarts.map(c => c.id === cart.id ? cart : c), false
        );
    }, [mutate]);

    const addCart = useCallback(async () => {
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        await dataService.save('carts', newCart);
        mutate(CARTS_KEY, [...carts, newCart], false);
        setActiveCartId(newCart.id);
    }, [carts, mutate]);

    const removeCart = useCallback(async (cartId: string) => {
        if (carts.length <= 1) {
            toast.error("Vous ne pouvez pas supprimer le dernier panier.");
            return;
        }
        await dataService.remove('carts', cartId);
        const newCarts = carts.filter(c => c.id !== cartId);
        mutate(CARTS_KEY, newCarts, false);

        if (activeCartId === cartId) {
            setActiveCartId(newCarts[0]?.id || null);
        }
    }, [carts, activeCartId, mutate]);
    
    const updateCart = useCallback(async (cartId: string, { product, quantity }: { product: Product; quantity: number }) => {
        const cart = carts.find(c => c.id === cartId);
        if (!cart) return;

        const existingItemIndex = cart.items.findIndex(item => item.id === product.id);
        let newItems: CartItem[];

        if (existingItemIndex > -1) {
            newItems = [...cart.items];
            const existingItem = newItems[existingItemIndex];
            const newQuantity = existingItem.cartQuantity + quantity;
            if (typeof product.id === 'number' && newQuantity > product.quantity) {
                 toast.warning(`Stock limité pour ${product.name}`, { description: `Vous ne pouvez pas ajouter plus de ${product.quantity} unités.` });
                 return;
            }
            newItems[existingItemIndex] = { ...existingItem, cartQuantity: newQuantity, flash: true };
            toast.success(`${product.name} mis à jour dans le panier.`);
        } else {
             if (typeof product.id === 'number' && quantity > product.quantity) {
                toast.warning(`Stock insuffisant pour ${product.name}`, { description: `Seulement ${product.quantity} unités disponibles.` });
                return;
            }
            const newItem: CartItem = { ...product, cartQuantity: quantity, flash: true };
            newItems = [...cart.items, newItem];
            toast.success(`${product.name} ajouté au panier.`);
        }
        await saveCart({ ...cart, items: newItems });
        
        // Remove flash effect after animation
        setTimeout(() => {
            const finalItems = newItems.map(item => ({ ...item, flash: false }));
            saveCart({ ...cart, items: finalItems });
        }, 700);

    }, [carts, saveCart]);
    
    const updateCartItemQuantity = useCallback(async (itemId: string | number, newQuantity: number) => {
        if (!activeCart) return;
        const itemIndex = activeCart.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = activeCart.items[itemIndex];
        if (typeof item.id === 'number' && newQuantity > item.quantity) {
            toast.warning(`Stock limité`, { description: `Maximum ${item.quantity} unités pour ${item.name}.` });
            return;
        }

        const newItems = [...activeCart.items];
        if (newQuantity <= 0) {
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex] = { ...item, cartQuantity: newQuantity };
        }
        await saveCart({ ...activeCart, items: newItems });
    }, [activeCart, saveCart]);

    const removeCartItem = useCallback(async (itemId: string | number) => {
        if (!activeCart) return;
        const newItems = activeCart.items.filter(item => item.id !== itemId);
        await saveCart({ ...activeCart, items: newItems });
    }, [activeCart, saveCart]);

    const clearCart = useCallback(async () => {
        if (!activeCart) return;
        await saveCart({ ...activeCart, items: [], customerId: null, customerName: '', discount: { type: 'fixed', value: 0 } });
    }, [activeCart, saveCart]);
    
    const setCartCustomer = useCallback(async (customer: Customer | null) => {
        if (!activeCart) return;
        const customerId = customer ? customer.id! : null;
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
        await saveCart({ ...activeCart, customerId, customerName });
    }, [activeCart, saveCart]);

    const setCartDiscount = useCallback(async (discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCart) return;
        
        const value = Math.max(0, discount.value || 0);
        const subtotal = activeCart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

        if (discount.type === 'fixed' && value > subtotal) {
            toast.warning("La remise fixe ne peut pas être supérieure au sous-total.");
            await saveCart({ ...activeCart, discount: { type: 'fixed', value: subtotal } });
            return;
        }

        if (discount.type === 'percentage' && (value < 0 || value > 100)) {
            toast.warning("Le pourcentage de remise doit être compris entre 0 et 100.");
            const clampedValue = Math.max(0, Math.min(100, value));
            await saveCart({ ...activeCart, discount: { type: 'percentage', value: clampedValue } });
            return;
        }

        await saveCart({ ...activeCart, discount: { ...discount, value } });
    }, [activeCart, saveCart]);


    return {
        carts,
        activeCartId: activeCartId || '',
        activeCart: activeCart,
        setActiveCartId,
        addCart,
        removeCart,
        updateCart,
        clearCart,
        updateCartItemQuantity,
        removeCartItem,
        setCartCustomer,
        setCartDiscount,
        isLoading: isLoading && carts.length === 0,
        error,
    };
};
