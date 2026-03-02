'use client';

import { useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '@/services/data-service';
import type { Cart, Product, CartItem, Customer } from '@/lib/types';
import { toast } from 'sonner';

const ACTIVE_CART_ID_KEY = 'active_cart_id';

const createNewCart = (name: string): Cart => ({
  id: uuidv4(),
  name,
  items: [],
  customerId: null,
  customerName: '',
  discount: { type: 'fixed', value: 0 },
});

export const useCarts = () => {
    const carts = useLiveQuery(() => dataService.getAll<Cart>('carts'));
    const activeCartIdSetting = useLiveQuery(() => dataService.getSetting(ACTIVE_CART_ID_KEY));
    
    const activeCartId = activeCartIdSetting?.value;
    const isLoading = carts === undefined || activeCartIdSetting === undefined;

    useEffect(() => {
        const initializeCarts = async () => {
            if (isLoading) return;

            if (!carts || carts.length === 0) {
                const newCart = createNewCart('Panier 1');
                await dataService.saveCart(newCart);
                await dataService.setSetting(ACTIVE_CART_ID_KEY, newCart.id);
            } else if (!activeCartId || !carts.some(c => c.id === activeCartId)) {
                await dataService.setSetting(ACTIVE_CART_ID_KEY, carts[0].id);
            }
        };
        initializeCarts();
    }, [carts, activeCartId, isLoading]);

    const setActiveCartId = useCallback(async (id: string) => {
        await dataService.setSetting(ACTIVE_CART_ID_KEY, id);
    }, []);

    const activeCart = carts?.find(c => c.id === activeCartId);

    const addCart = useCallback(async () => {
        if(!carts) return;
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        await dataService.saveCart(newCart);
        await setActiveCartId(newCart.id);
    }, [carts, setActiveCartId]);

    const removeCart = useCallback(async (cartId: string) => {
        if (!carts || carts.length <= 1) {
            toast.error("Vous ne pouvez pas supprimer le dernier panier.");
            return;
        }
        
        const currentActiveId = activeCartId;
        const newCarts = carts.filter(c => c.id !== cartId);

        await dataService.deleteCart(cartId);

        if (currentActiveId === cartId) {
            await setActiveCartId(newCarts[0]?.id || '');
        }
    }, [carts, activeCartId, setActiveCartId]);
    
    const addProductToCart = useCallback(async (product: Product, quantity: number) => {
        if(!activeCart) return;

        const cart = activeCart;
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
        await dataService.saveCart({ ...cart, items: newItems });
        
        // Remove flash effect after animation
        setTimeout(async () => {
            const currentCart = await dataService.getCart(cart.id);
            if (currentCart) {
                const finalItems = currentCart.items.map(item => ({ ...item, flash: false }));
                await dataService.saveCart({ ...currentCart, items: finalItems });
            }
        }, 700);

    }, [activeCart]);
    
    const updateCartItemQuantity = useCallback(async (itemId: string | number, newQuantity: number) => {
        if (!activeCart) return;
        const itemIndex = activeCart.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = activeCart.items[itemIndex];
        if (typeof item.id === 'number' && newQuantity > item.quantity) {
            toast.warning(`Stock limité`, { description: `Maximum ${item.quantity} unités pour ${item.name}.` });
            // Revert to max quantity
            const newItems = [...activeCart.items];
            newItems[itemIndex] = { ...item, cartQuantity: item.quantity };
            await dataService.saveCart({ ...activeCart, items: newItems });
            return;
        }

        const newItems = [...activeCart.items];
        if (newQuantity <= 0) {
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex] = { ...item, cartQuantity: newQuantity };
        }
        await dataService.saveCart({ ...activeCart, items: newItems });
    }, [activeCart]);

    const removeCartItem = useCallback(async (itemId: string | number) => {
        if (!activeCart) return;
        const newItems = activeCart.items.filter(item => item.id !== itemId);
        await dataService.saveCart({ ...activeCart, items: newItems });
    }, [activeCart]);

    const clearCart = useCallback(async () => {
        if (!activeCart) return;
        await dataService.saveCart({ ...activeCart, items: [], customerId: null, customerName: '', discount: { type: 'fixed', value: 0 } });
    }, [activeCart]);
    
    const setCartCustomer = useCallback(async (customer: Customer | null) => {
        if (!activeCart) return;
        const customerId = customer ? customer.id! : null;
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
        await dataService.saveCart({ ...activeCart, customerId, customerName });
    }, [activeCart]);

    const setCartDiscount = useCallback(async (discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCart) return;
        
        const value = Math.max(0, discount.value || 0);
        const subtotal = activeCart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);

        if (discount.type === 'fixed' && value > subtotal) {
            toast.warning("La remise fixe ne peut pas être supérieure au sous-total.");
            await dataService.saveCart({ ...activeCart, discount: { type: 'fixed', value: subtotal } });
            return;
        }

        if (discount.type === 'percentage' && (value < 0 || value > 100)) {
            toast.warning("Le pourcentage de remise doit être compris entre 0 et 100.");
            const clampedValue = Math.max(0, Math.min(100, value));
            await dataService.saveCart({ ...activeCart, discount: { type: 'percentage', value: clampedValue } });
            return;
        }

        await dataService.saveCart({ ...activeCart, discount: { ...discount, value } });
    }, [activeCart]);


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
        isLoading,
        error: null,
    };
};
