'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, CompanyProfile, Product, Sale, Customer } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';

/**
 * @fileOverview THE STATE SINGULARITY
 * Single source of truth for runtime application state.
 * Direct persistence (LocalStorage/IndexedDB) is strictly FORBIDDEN.
 * Truth is derived exclusively from the API Wall.
 */

interface AppState {
    session: Session | null;
    user: User | null;
    profile: CompanyProfile | null;
    sessionLoading: boolean;
    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;
    actions: {
        setSession: (session: Session | null) => void;
        fetchProfile: () => Promise<void>;
        signOut: () => Promise<void>;
        createNewCart: () => void;
        switchToCart: (id: string) => void;
        addProductToCart: (product: Product, quantity: number) => void;
        removeCartItem: (uuid: string) => void;
        updateCartItemQuantity: (uuid: string, qty: number) => void;
        updateCartItemPrice: (uuid: string, price: number) => void;
        setCartCustomer: (customer: Customer | null) => void;
        setCartDiscount: (discount: { type: 'fixed' | 'percentage', value: number }) => void;
        clearCart: () => void;
        finalizeSale: (paymentData: any) => Promise<void>;
        clearLastCompletedSale: () => void;
        clearCartFlashes: () => void;
    };
}

const createInitialCart = (id = uuidv4()): Cart => ({
    id,
    name: 'Panier Actif',
    items: [],
    customerUuid: null,
    discount: { type: 'fixed', value: 0 },
});

export const useAppStore = create<AppState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    sessionLoading: true,
    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    actions: {
        setSession: (session) => {
            const activeId = get().activeCartId || get().carts[0].id;
            set({ session, user: session?.user ?? null, sessionLoading: false, activeCartId: activeId });
        },

        fetchProfile: async () => {
            try {
                const profile = await api.get<CompanyProfile>('profile');
                set({ profile });
            } catch (e) {
                set({ profile: null });
            }
        },

        signOut: async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            set({ session: null, user: null, profile: null, carts: [createInitialCart()] });
            window.location.href = '/login';
        },

        createNewCart: () => set(produce((state: AppState) => {
            const newCart = createInitialCart();
            state.carts.push(newCart);
            state.activeCartId = newCart.id;
        })),

        switchToCart: (id) => set({ activeCartId: id }),

        addProductToCart: (product, quantity) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const existing = cart.items.find(i => i.uuid === product.uuid);
            if (existing) {
                existing.cartQuantity += quantity;
                existing.flash = true;
            } else {
                cart.items.unshift({ ...product, cartQuantity: quantity, flash: true } as any);
            }
        })),

        removeCartItem: (uuid) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.items = cart.items.filter(i => i.uuid !== uuid);
        })),

        updateCartItemQuantity: (uuid, qty) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const item = cart.items.find(i => i.uuid === uuid);
            if (item) {
                item.cartQuantity = Math.max(1, qty);
            }
        })),

        updateCartItemPrice: (uuid, price) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const item = cart.items.find(i => i.uuid === uuid);
            if (item) {
                item.price = Math.max(0, price);
            }
        })),

        setCartCustomer: (customer) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.customerUuid = customer?.uuid || null;
        })),

        setCartDiscount: (discount) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            state.carts.forEach((c, idx) => {
                if (c.id === state.activeCartId) state.carts[idx].discount = discount;
            });
        })),

        clearCart: () => set(produce((state: AppState) => {
            const index = state.carts.findIndex(c => c.id === state.activeCartId);
            if (index !== -1) {
                state.carts[index] = createInitialCart(state.activeCartId);
            }
        })),

        finalizeSale: async (paymentData) => {
            const state = get();
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            
            const saleData = {
                items: cart.items,
                customerUuid: cart.customerUuid,
                discountType: cart.discount.type,
                discountValue: cart.discount.value,
                ...paymentData
            };

            const result = await api.post<Sale>('sales', saleData);
            set(produce((state: AppState) => {
                state.lastCompletedSale = { sale: result };
                const index = state.carts.findIndex(c => c.id === state.activeCartId);
                state.carts[index] = createInitialCart(state.activeCartId);
            }));
        },

        clearLastCompletedSale: () => set({ lastCompletedSale: null }),

        clearCartFlashes: () => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.items.forEach(i => { (i as any).flash = false; });
        })),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useIsManagerOrAdmin = () => {
    const role = useAppStore(state => state.profile?.role);
    return role === 'admin' || role === 'manager';
};
