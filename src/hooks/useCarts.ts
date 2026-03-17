'use client';

import { useEffect, useState, useCallback } from 'react';
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
    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const activeCart = carts?.find(c => c.id === activeCartId);
    
    const loadCarts = useCallback(async () => {
        setIsLoading(true);
        const [loadedCarts, activeIdSetting] = await Promise.all([
            dataService.getAll<Cart>('carts'),
            dataService.getSetting(ACTIVE_CART_ID_KEY)
        ]);

        if (loadedCarts.length === 0) {
            const newCart = createNewCart('Panier 1');
            await dataService.saveCart(newCart);
            await dataService.setSetting(ACTIVE_CART_ID_KEY, newCart.id);
            setCarts([newCart]);
            setActiveCartIdState(newCart.id);
        } else {
            setCarts(loadedCarts);
            if (activeIdSetting?.value && loadedCarts.some(c => c.id === activeIdSetting.value)) {
                setActiveCartIdState(activeIdSetting.value);
            } else {
                setActiveCartIdState(loadedCarts[0].id);
                await dataService.setSetting(ACTIVE_CART_ID_KEY, loadedCarts[0].id);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadCarts();
    }, [loadCarts]);

    const setActiveCartId = useCallback(async (id: string) => {
        await dataService.setSetting(ACTIVE_CART_ID_KEY, id);
        setActiveCartIdState(id);
    }, []);

    const addCart = useCallback(async () => {
        if(carts === undefined) return;
        const newCart = createNewCart(`Panier ${carts.length + 1}`);
        await dataService.saveCart(newCart);
        setCarts(prev => [...prev, newCart]);
        await setActiveCartId(newCart.id);
    }, [carts, setActiveCartId]);

    const removeCart = useCallback(async (cartId: string) => {
        await dataService.deleteCart(cartId);
        
        const remainingCarts = carts.filter(c => c.id !== cartId);
        
        if (remainingCarts.length === 0) {
            const newCart = createNewCart('Panier 1');
            await dataService.saveCart(newCart);
            setCarts([newCart]);
            await setActiveCartId(newCart.id);
        } else {
             setCarts(remainingCarts);
            if (activeCartId === cartId) {
                await setActiveCartId(remainingCarts[0].id);
            }
        }
    }, [carts, activeCartId, setActiveCartId]);
    
    const addProductToCart = useCallback(async (product: Product, quantity: number) => {
        if(!activeCartId) return;
        try {
            await dataService.addProductToCart(activeCartId, product, quantity);
            await loadCarts(); // Reload carts to reflect changes
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de l'ajout du produit.");
        }
    }, [activeCartId, loadCarts]);
    
    const updateCartItemQuantity = useCallback(async (itemId: string | number, newQuantity: number) => {
        if (!activeCartId || !activeCart) return;
        try {
            const result = await dataService.updateCartItemQuantity(activeCartId, itemId, newQuantity);
            if (result.capped) {
                const item = activeCart.items.find(i => i.id === itemId);
                toast.warning(`Stock limité`, { description: `Maximum ${result.maxQuantity} unités pour ${item?.name}.` });
            }
            await loadCarts();
        } catch (e: any) {
             toast.error(e.message || "Erreur lors de la mise à jour de la quantité.");
        }
    }, [activeCartId, activeCart, loadCarts]);

    const removeCartItem = useCallback(async (itemId: string | number) => {
        if (!activeCartId) return;
        await dataService.removeCartItem(activeCartId, itemId);
        await loadCarts();
    }, [activeCartId, loadCarts]);

    const clearCart = useCallback(async () => {
        if (!activeCartId) return;
        await dataService.clearCart(activeCartId);
        await loadCarts();
    }, [activeCartId, loadCarts]);
    
    const setCartCustomer = useCallback(async (customer: Customer | null) => {
        if (!activeCartId) return;
        await dataService.setCartCustomer(activeCartId, customer);
        await loadCarts();
    }, [activeCartId, loadCarts]);

    const setCartDiscount = useCallback(async (discount: { type: 'fixed' | 'percentage'; value: number }) => {
        if (!activeCartId || !activeCart) return;
        const value = discount.value || 0;
        const subtotal = activeCart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        if (discount.type === 'fixed' && value > subtotal) toast.warning("La remise est plafonnée au sous-total.");
        if (discount.type === 'percentage' && (value < 0 || value > 100)) toast.warning("Le pourcentage de remise doit être compris entre 0 et 100.");
        await dataService.setCartDiscount(activeCartId, discount);
        await loadCarts();
    }, [activeCartId, activeCart, loadCarts]);

    const saveActiveCartAsDraft = useCallback(async (notes?: string) => {
        if (!activeCart) throw new Error("Aucun panier actif à sauvegarder.");
        await dataService.saveDraft(activeCart, notes);
    }, [activeCart]);
    
    const loadDraftToCart = useCallback(async (draftId: number) => {
        if (!activeCartId || !activeCart) return;
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
            discount: draft.discount,
        };

        await dataService.saveCart(updatedCart as Cart);
        await dataService.deleteDraft(draftId);
        await loadCarts();
        toast.success(`Brouillon chargé dans ${activeCart?.name}.`);

    }, [activeCart, activeCartId, loadCarts]);

    useEffect(() => {
        if (activeCart && activeCart.items.some(i => i.flash)) {
            const timer = setTimeout(async () => {
                await dataService.removeFlashFromCartItems(activeCart.id);
                await loadCarts();
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [activeCart, loadCarts]);

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
    };
};
