
'use client';

import { useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '@/services/data-service';
import type { Cart, Product, Customer, Draft } from '@/lib/types';
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
        if (carts === undefined) return;
        const initializeCarts = async () => {
            if (carts.length === 0) {
                const newCart = createNewCart('Panier 1');
                await dataService.saveCart(newCart);
                await dataService.setSetting(ACTIVE_CART_ID_KEY, newCart.id);
            } else if (!activeCartId || !carts.some(c => c.id === activeCartId)) {
                await dataService.setSetting(ACTIVE_CART_ID_KEY, carts[0].id);
            }
        };
        initializeCarts();
    }, [carts, activeCartId]);

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
        const newCarts = carts.filter(c => c.id !== cartId);
        await dataService.deleteCart(cartId);
        if (activeCartId === cartId) {
            await setActiveCartId(newCarts[0]?.id || '');
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
        const value = discount.value || 0;
        const subtotal = activeCart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        if (discount.type === 'fixed' && value > subtotal) toast.warning("La remise est plafonnée au sous-total.");
        if (discount.type === 'percentage' && (value < 0 || value > 100)) toast.warning("Le pourcentage de remise doit être compris entre 0 et 100.");
        await dataService.setCartDiscount(activeCartId, discount);
    }, [activeCartId, activeCart]);

    const saveActiveCartAsDraft = useCallback(async (notes?: string) => {
        if (!activeCart) throw new Error("Aucun panier actif à sauvegarder.");
        await dataService.saveDraft(activeCart, notes);
    }, [activeCart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        if (!activeCartId) return;
        const draft = await dataService.getById<Draft>('drafts', draftId);
        if (!draft) {
            toast.error("Brouillon non trouvé.");
            return;
        }
        
        const updatedCart = {
            ...activeCart,
            items: draft.items,
            customerId: draft.customerId,
            customerName: draft.customerName,
        };

        await dataService.saveCart(updatedCart as Cart);
        await dataService.deleteDraft(draftId);
        toast.success(`Brouillon chargé dans ${activeCart?.name}.`);

    }, [activeCart, activeCartId]);

    useEffect(() => {
        if (activeCart && activeCart.items.some(i => i.flash)) {
            const timer = setTimeout(() => {
                dataService.removeFlashFromCartItems(activeCart.id);
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
        isLoading,
        error: null,
    };
};
