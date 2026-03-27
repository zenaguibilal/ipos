
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
 * PHASE 5: ENFORCED MEMORY-ONLY SINGULARITY.
 * لا يوجد تخزين مستمر. الحالة تعيش في الذاكرة وتموت مع الجلسة.
 */

interface AppState {
    session: Session | null;
    user: User | null;
    profile: CompanyProfile | null;
    sessionLoading: boolean;
    isSettingsLoading: boolean;
    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;
    customerViewMode: 'grid' | 'list';
    productViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';
    salesHistoryViewMode: 'grid' | 'list';
    returnViewMode: 'grid' | 'list';
    supplierViewMode: 'grid' | 'list';
    expenseViewMode: 'grid' | 'list';
    actions: {
        setSession: (session: Session | null) => void;
        fetchProfile: () => Promise<void>;
        updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
        signOut: () => Promise<void>;
        resetStore: () => void;
        createNewCart: () => void;
        switchToCart: (id: string) => void;
        deleteCart: (id: string) => void;
        addProductToCart: (product: Product, quantity: number) => void;
        removeCartItem: (uuid: string) => void;
        updateCartItemQuantity: (uuid: string, qty: number) => void;
        updateCartItemPrice: (uuid: string, price: number) => void;
        setCartCustomer: (customer: Customer | null) => void;
        setCartDiscount: (discount: { type: 'fixed' | 'percentage', value: number }) => void;
        clearCart: () => void;
        clearCartFlashes: () => void;
        finalizeSale: (paymentData: any) => Promise<boolean>;
        processReturn: (returnData: any) => Promise<boolean>;
        processStockIntake: (intakeData: any) => Promise<boolean>;
        clearLastCompletedSale: () => void;
        setCustomerViewMode: (mode: 'grid' | 'list') => void;
        setProductViewMode: (mode: 'grid' | 'list') => void;
        setStockViewMode: (mode: 'grid' | 'list') => void;
        setSalesHistoryViewMode: (mode: 'grid' | 'list') => void;
        setReturnViewMode: (mode: 'grid' | 'list') => void;
        setSupplierViewMode: (mode: 'grid' | 'list') => void;
        setExpenseViewMode: (mode: 'grid' | 'list') => void;
    };
}

const createInitialCart = (): Cart => ({
    id: uuidv4(),
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
    isSettingsLoading: false,
    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    customerViewMode: 'grid',
    productViewMode: 'grid',
    stockViewMode: 'grid',
    salesHistoryViewMode: 'list',
    returnViewMode: 'list',
    supplierViewMode: 'grid',
    expenseViewMode: 'grid',
    actions: {
        setSession: (session) => set({ 
            session, 
            user: session?.user ?? null, 
            sessionLoading: false 
        }),
        fetchProfile: async () => {
            set({ isSettingsLoading: true });
            try {
                const profile = await api.get<CompanyProfile>('profile');
                set({ profile });
            } finally {
                set({ isSettingsLoading: false });
            }
        },
        updateProfile: async (data) => {
            const updated = await api.put<CompanyProfile>('profile', data);
            set({ profile: updated });
        },
        signOut: async () => {
            try {
                await api.post('auth/signout', {});
            } finally {
                get().actions.resetStore();
                window.location.href = '/login';
            }
        },
        resetStore: () => set({
            session: null,
            user: null,
            profile: null,
            carts: [createInitialCart()],
            activeCartId: '',
            lastCompletedSale: null,
        }),
        createNewCart: () => set(produce((state: AppState) => {
            const newCart = createInitialCart();
            state.carts.push(newCart);
            state.activeCartId = newCart.id;
        })),
        switchToCart: (id) => set({ activeCartId: id }),
        deleteCart: (id) => set(produce((state: AppState) => {
            state.carts = state.carts.filter(c => c.id !== id);
            if (state.activeCartId === id) state.activeCartId = state.carts[0]?.id || '';
        })),
        addProductToCart: (product, quantity) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const existing = cart.items.find(i => i.uuid === product.uuid);
            if (existing) {
                existing.cartQuantity += quantity;
                existing.flash = true;
            } else {
                cart.items.push({ ...product, cartQuantity: quantity, flash: true });
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
        updateCartItemPrice: (uuid, price) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            const item = cart.items.find(i => i.uuid === uuid);
            if (item) item.price = price;
        })),
        setCartCustomer: (customer) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.customerUuid = customer?.uuid || null;
        })),
        setCartDiscount: (discount) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
            cart.discount = discount;
        })),
        clearCart: () => set(produce((state: AppState) => {
            const index = state.carts.findIndex(c => c.id === state.activeCartId);
            if (index !== -1) state.carts[index] = createInitialCart();
        })),
        clearCartFlashes: () => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (cart) cart.items.forEach(i => i.flash = false);
        })),
        finalizeSale: async (paymentData) => {
            const cart = get().carts.find(c => c.id === get().activeCartId);
            if (!cart || cart.items.length === 0) return false;
            try {
                const sale = await api.post<Sale>('sales', { ...cart, ...paymentData });
                set({ lastCompletedSale: { sale } });
                get().actions.clearCart();
                return true;
            } catch (e: any) {
                return false;
            }
        },
        processReturn: async (data) => {
            await api.post('returns', data);
            return true;
        },
        processStockIntake: async (data) => {
            await api.post('stock', data);
            return true;
        },
        clearLastCompletedSale: () => set({ lastCompletedSale: null }),
        setCustomerViewMode: (mode) => set({ customerViewMode: mode }),
        setProductViewMode: (mode) => set({ productViewMode: mode }),
        setStockViewMode: (mode) => set({ stockViewMode: mode }),
        setSalesHistoryViewMode: (mode) => set({ salesHistoryViewMode: mode }),
        setReturnViewMode: (mode) => set({ returnViewMode: mode }),
        setSupplierViewMode: (mode) => set({ supplierViewMode: mode }),
        setExpenseViewMode: (mode) => set({ expenseViewMode: mode }),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useIsManagerOrAdmin = () => useAppStore(state => state.profile?.role === 'manager' || state.profile?.role === 'admin');
