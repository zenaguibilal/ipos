'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, CompanyProfile, Product, Sale, Customer } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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
        setProfile: (profile: CompanyProfile | null) => void;
        createNewCart: () => void;
        switchToCart: (id: string) => void;
        addProductToCart: (product: Product, quantity: number) => void;
        removeCartItem: (uuid: string) => void;
        updateCartItemQuantity: (uuid: string, qty: number) => void;
        setCartCustomer: (customer: Customer | null) => void;
        clearCart: () => void;
        setLastCompletedSale: (sale: Sale, customer?: Customer) => void;
        clearLastCompletedSale: () => void;
    };
}

const createInitialCart = (): Cart => ({
    id: uuidv4(),
    name: 'Panier Actif',
    items: [],
    customerUuid: null,
    discount: { type: 'fixed', value: 0 },
});

export const useAppStore = create<AppState>((set) => ({
    session: null,
    user: null,
    profile: null,
    sessionLoading: true,
    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    actions: {
        setSession: (session) => set({ 
            session, 
            user: session?.user ?? null, 
            sessionLoading: false 
        }),
        setProfile: (profile) => set({ profile }),
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
            } else {
                cart.items.push({ ...product, cartQuantity: quantity });
            }
        })),
        removeCartItem: (uuid) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.items = cart.items.filter(i => i.uuid !== uuid);
        })),
        updateCartItemQuantity: (uuid, qty) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const item = cart.items.find(i => i.uuid === uuid);
            if (item) item.cartQuantity = Math.max(1, qty);
        })),
        setCartCustomer: (customer) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.customerUuid = customer?.uuid || null;
        })),
        clearCart: () => set(produce((state: AppState) => {
            const index = state.carts.findIndex(c => c.id === state.activeCartId);
            if (index !== -1) state.carts[index] = createInitialCart();
        })),
        setLastCompletedSale: (sale, customer) => set({ lastCompletedSale: { sale, customer } }),
        clearLastCompletedSale: () => set({ lastCompletedSale: null }),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
