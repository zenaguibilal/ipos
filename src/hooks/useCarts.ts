'use client';

import { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '@/services/data-service';
import type { Cart, Product, Customer, Draft } from '@/lib/types';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/lib/database';

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
    const db = getDb();
    const [activeCartId, setActiveCartIdState] = useState<string | null>(null);

    // Step 1: Just fetch the carts reactively.
    const carts = useLiveQuery(() => db.carts.toArray(), []);

    // Step 2: Handle the case where no carts exist.
    useEffect(() => {
        if (carts && carts.length === 0) {
            const firstCart = createNewCart('Panier 1');
            db.carts.add(firstCart).then(id => {
                // When adding is successful, set it as the active one.
                dataService.setSetting(ACTIVE_CART_ID_KEY, id);
                setActiveCartIdState(id as string);
            });
        }
    }, [carts, db.carts]);

    // Step 3: Determine the active cart ID once carts are loaded.
    useEffect(() => {
        if (!activeCartId && carts && carts.length > 0) {
            dataService.getSetting(ACTIVE_CART_ID_KEY).then(setting => {
                const validStoredId = setting && setting.value && carts.some(c => c.id === setting.value);
                if (validStoredId) {
                    setActiveCartIdState(setting.value);
                } else {
                    // Fallback to the first cart if the stored one is invalid
                    setActiveCartIdState(carts[0].id);
                }
            });
        }
    }, [carts, activeCartId]);


    const activeCart = carts?.find(c => c.id === activeCartId);

    const setActiveCartId = useCallback(async (id: string) => {
        await dataService.setSetting(ACTIVE_CART_ID_KEY, id);
        setActiveCartIdState(id);
    }, []);

    const addCart = useCallback(async () => {
        if(carts === undefined) return;
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        await dataService.saveCart(newCart);
        await setActiveCartId(newCart.id);
    }, [carts, setActiveCartId]);

    const removeCart = useCallback(async (cartId: string) => {
        if (!carts || carts.length <= 1) {
            toast.warning("Impossible de supprimer le dernier panier.");
            return;
        }
        await dataService.deleteCart(cartId);
        
        const remainingCarts = carts.filter(c => c.id !== cartId);
        if (activeCartId === cartId && remainingCarts.length > 0) {
            await setActiveCartId(remainingCarts[0].id);
        }
    }, [carts, activeCartId, setActiveCartId]);
    
    const addProductToCart = useCallback(async (product: Product, quantity: number) => {
        if(!activeCartId) return;
        try {
            await dataService.addProductToCart(activeCartId, product, quantity);
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de l'ajout du produit.");
        }
    }, [activeCartId]);
    
    const updateCartItemQuantity = useCallback(async (itemId: string | number, newQuantity: number) => {
        if (!activeCartId || !activeCart) return;
        try {
            const result = await dataService.updateCartItemQuantity(activeCartId, itemId, newQuantity);
            if (result.capped) {
                const item = activeCart.items.find(i => i.id === itemId);
                toast.warning(`Stock limité`, { description: `Maximum ${result.maxQuantity} unités pour ${item?.name}.` });
            }
        } catch (e: any) {
             toast.error(e.message || "Erreur lors de la mise à jour de la quantité.");
        }
    }, [activeCartId, activeCart]);

    const removeCartItem = useCallback(async (itemId: string | number) => {
        if (!activeCartId) return;
        await dataService.removeCartItem(activeCartId, itemId);
    }, [activeCartId]);

    const clearCart = useCallback(async () => {
        if (!activeCartId) return;
        await dataService.clearCart(activeCartId);
    }, [activeCartId]);
    
    const setCartCustomer = useCallback(async (customer: Customer | null) => {
        if (!activeCartId) return;
        await dataService.setCartCustomer(activeCartId, customer);
    }, [activeCartId]);

    const setCartDiscount = useCallback(async (discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCartId || !activeCart) return;
        await dataService.setCartDiscount(activeCartId, discount);
    }, [activeCartId, activeCart]);

    const saveActiveCartAsDraft = useCallback(async (notes?: string) => {
        if (!activeCart) throw new Error("Aucun panier actif à sauvegarder.");
        await dataService.saveDraft(activeCart, notes);
    }, [activeCart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        if (!activeCart) return;

        const draftContent = await dataService.getDraftAndClear(draftId);
        if (!draftContent) {
            toast.error("Brouillon non trouvé.");
            return;
        }

        const targetCartIsNotEmpty = activeCart.items.length > 0;

        if (targetCartIsNotEmpty) {
            const newCartName = `Brouillon (${draftContent.customerName || 'Nouveau'})`;
            const newCart = createNewCart(newCartName);
            newCart.items = draftContent.items;
            newCart.customerId = draftContent.customerId;
            newCart.customerName = draftContent.customerName;
            newCart.discount = draftContent.discount;
            
            await dataService.saveCart(newCart);
            await setActiveCartId(newCart.id);
            toast.success(`Brouillon chargé dans un nouveau panier: "${newCartName}".`);
        } else {
            await dataService.loadDraftContentToCart(activeCart.id, draftContent);
            toast.success(`Brouillon chargé dans ${activeCart.name}.`);
        }
    }, [activeCart, setActiveCartId]);

    useEffect(() => {
        if (activeCart && activeCart.items.some(i => i.flash)) {
            const timer = setTimeout(async () => {
                await dataService.removeFlashFromCartItems(activeCart.id);
            }, 700);
            return () => clearTimeout(timer);
        }
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
        saveActiveCartAsDraft,
        loadDraftToCart,
        isLoading: carts === undefined || !activeCart,
    };
};
