'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, CompanyProfile, Product, Sale, Customer, Supplier, Expense, StockIntake } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';

/**
 * @fileOverview THE STATE SINGULARITY (DOMINATION EDITION)
 * تم تكييف المتجر للعمل في وضع "الوصول المباشر" بدون قيود جلسة.
 */

interface AppState {
    session: Session | null;
    user: User | null;
    profile: CompanyProfile | null;
    sessionLoading: boolean;
    isSettingsLoading: boolean;
    
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    expenses: Expense[];
    salesHistory: Sale[];
    
    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;
    isLoading: Record<string, boolean>;

    actions: {
        setSession: (session: Session | null) => void;
        fetchProfile: () => Promise<void>;
        updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
        signOut: () => Promise<void>;
        resetStore: () => void;
        
        refreshProducts: (query?: string) => Promise<void>;
        refreshCustomers: (status?: string) => Promise<void>;
        refreshSuppliers: () => Promise<void>;
        refreshExpenses: (from: string, to: string) => Promise<void>;
        refreshSalesHistory: (from: string, to: string) => Promise<void>;

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
        
        finalizeSale: (paymentData: any) => Promise<boolean>;
        processReturn: (returnData: any) => Promise<boolean>;
        processStockIntake: (intakeData: any) => Promise<boolean>;
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

export const useAppStore = create<AppState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    sessionLoading: false, // تم الإلغاء لفرض التشغيل الفوري
    isSettingsLoading: false,
    
    products: [],
    customers: [],
    suppliers: [],
    expenses: [],
    salesHistory: [],
    
    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    isLoading: {},

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
            } catch (e) {
                // في وضع الهيمنة، الفشل في جلب البروفايل لا يوقف النظام
                console.warn("Profile fetch failed, using default settings.");
            } finally {
                set({ isSettingsLoading: false });
            }
        },

        refreshProducts: async (query) => {
            set(p => ({ isLoading: { ...p.isLoading, products: true } }));
            try {
                const products = await api.get<Product[]>(`products${query ? `?query=${query}` : ''}`);
                set({ products });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, products: false } }));
            }
        },

        refreshCustomers: async (status) => {
            set(p => ({ isLoading: { ...p.isLoading, customers: true } }));
            try {
                const customers = await api.get<Customer[]>(`customers${status ? `?status=${status}` : ''}`);
                set({ customers });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, customers: false } }));
            }
        },

        refreshSuppliers: async () => {
            set(p => ({ isLoading: { ...p.isLoading, suppliers: true } }));
            try {
                const suppliers = await api.get<Supplier[]>('suppliers');
                set({ suppliers });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, suppliers: false } }));
            }
        },

        refreshExpenses: async (from, to) => {
            set(p => ({ isLoading: { ...p.isLoading, expenses: true } }));
            try {
                const expenses = await api.get<Expense[]>(`expenses?from=${from}&to=${to}`);
                set({ expenses });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, expenses: false } }));
            }
        },

        refreshSalesHistory: async (from, to) => {
            set(p => ({ isLoading: { ...p.isLoading, sales: true } }));
            try {
                const salesHistory = await api.get<Sale[]>(`sales?from=${from}&to=${to}`);
                set({ salesHistory });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, sales: false } }));
            }
        },

        updateProfile: async (data) => {
            const updated = await api.put<CompanyProfile>('profile', data);
            set({ profile: updated });
        },

        signOut: async () => {
            // تسجيل الخروج يقوم فقط بمسح الذاكرة في هذا الوضع
            get().actions.resetStore();
            window.location.href = '/';
        },

        resetStore: () => set({
            session: null,
            user: null,
            profile: null,
            products: [],
            customers: [],
            suppliers: [],
            expenses: [],
            salesHistory: [],
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
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useIsManagerOrAdmin = () => true; // في وضع الهيمنة بدون دخول، نعتبر الوصول دائماً بصلاحيات كاملة
