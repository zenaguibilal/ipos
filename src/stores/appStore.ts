'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { 
    Cart, CompanyProfile, Product, Sale, Customer, Supplier, 
    Expense, StockIntake, BreadOrder, Recipe, SavedZakatCalculation 
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';

/**
 * @fileOverview THE STATE SINGULARITY (ABSOLUTE EDITION)
 * المركز السيادي والوحيد لكافة حالات النظام أثناء التشغيل.
 * يمنع منعاً باتاً وجود shadow states داخل المكونات.
 */

interface AppState {
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    
    // Core Data Entities
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    expenses: Expense[];
    salesHistory: Sale[];
    returns: any[];
    stockIntakes: StockIntake[];
    breadOrders: BreadOrder[];
    recipes: Recipe[];
    zakatHistory: SavedZakatCalculation[];
    
    // Categories Cache
    productCategories: string[];
    expenseCategories: string[];

    // View & Session
    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;
    isLoading: Record<string, boolean>;
    
    // App Config / UI State
    expenseViewMode: 'grid' | 'list';
    salesHistoryViewMode: 'grid' | 'list';
    returnViewMode: 'grid' | 'list';
    supplierViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';

    actions: {
        fetchProfile: () => Promise<void>;
        updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
        
        // Universal Refreshers
        refreshProducts: (params?: any) => Promise<void>;
        refreshCustomers: (params?: any) => Promise<void>;
        refreshSuppliers: () => Promise<void>;
        refreshExpenses: (params: any) => Promise<void>;
        refreshSalesHistory: (params: any) => Promise<void>;
        refreshReturns: (params: any) => Promise<void>;
        refreshStockIntakes: (params: any) => Promise<void>;
        refreshBreadOrders: (date: string) => Promise<void>;
        refreshRecipes: () => Promise<void>;
        refreshZakatHistory: () => Promise<void>;
        refreshCategories: () => Promise<void>;

        // UI State Actions
        setExpenseViewMode: (mode: 'grid' | 'list') => void;
        setSalesHistoryViewMode: (mode: 'grid' | 'list') => void;
        setReturnViewMode: (mode: 'grid' | 'list') => void;
        setSupplierViewMode: (mode: 'grid' | 'list') => void;
        setStockViewMode: (mode: 'grid' | 'list') => void;

        // POS Actions
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
        
        // Transaction Processors
        finalizeSale: (paymentData: any) => Promise<boolean>;
        processReturn: (returnData: any) => Promise<boolean>;
        processStockIntake: (intakeData: any) => Promise<boolean>;
        clearLastCompletedSale: () => void;
        
        resetStore: () => void;
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
    profile: null,
    isSettingsLoading: false,
    
    products: [],
    customers: [],
    suppliers: [],
    expenses: [],
    salesHistory: [],
    returns: [],
    stockIntakes: [],
    breadOrders: [],
    recipes: [],
    zakatHistory: [],
    
    productCategories: [],
    expenseCategories: [],

    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    isLoading: {},

    expenseViewMode: 'grid',
    salesHistoryViewMode: 'grid',
    returnViewMode: 'grid',
    supplierViewMode: 'grid',
    stockViewMode: 'grid',

    actions: {
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

        refreshProducts: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, products: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const products = await api.get<Product[]>(`products?${query}`);
                set({ products });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, products: false } }));
            }
        },

        refreshCustomers: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, customers: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const customers = await api.get<Customer[]>(`customers?${query}`);
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

        refreshExpenses: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, expenses: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const expenses = await api.get<Expense[]>(`expenses?${query}`);
                set({ expenses });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, expenses: false } }));
            }
        },

        refreshSalesHistory: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, sales: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const salesHistory = await api.get<Sale[]>(`sales?${query}`);
                set({ salesHistory });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, sales: false } }));
            }
        },

        refreshReturns: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, returns: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const returns = await api.get<any[]>(`returns?${query}`);
                set({ returns });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, returns: false } }));
            }
        },

        refreshStockIntakes: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, stock: true } }));
            try {
                const query = new URLSearchParams(params).toString();
                const stockIntakes = await api.get<StockIntake[]>(`stock?${query}`);
                set({ stockIntakes });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, stock: false } }));
            }
        },

        refreshBreadOrders: async (date) => {
            set(p => ({ isLoading: { ...p.isLoading, bread: true } }));
            try {
                const breadOrders = await api.get<BreadOrder[]>(`bread?date=${date}`);
                set({ breadOrders });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, bread: false } }));
            }
        },

        refreshRecipes: async () => {
            set(p => ({ isLoading: { ...p.isLoading, recipes: true } }));
            try {
                const recipes = await api.get<Recipe[]>('recipes');
                set({ recipes });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, recipes: false } }));
            }
        },

        refreshZakatHistory: async () => {
            set(p => ({ isLoading: { ...p.isLoading, zakat: true } }));
            try {
                const zakatHistory = await api.get<SavedZakatCalculation[]>('zakat?type=history');
                set({ zakatHistory });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, zakat: false } }));
            }
        },

        refreshCategories: async () => {
            const [prodCats, expCats] = await Promise.all([
                api.get<string[]>('products/categories'),
                api.get<string[]>('expenses/categories')
            ]);
            set({ productCategories: prodCats, expenseCategories: expCats });
        },

        setExpenseViewMode: (mode) => set({ expenseViewMode: mode }),
        setSalesHistoryViewMode: (mode) => set({ salesHistoryViewMode: mode }),
        setReturnViewMode: (mode) => set({ returnViewMode: mode }),
        setSupplierViewMode: (mode) => set({ supplierViewMode: mode }),
        setStockViewMode: (mode) => set({ stockViewMode: mode }),

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
            const cartId = state.activeCartId || state.carts[0].id;
            const cart = state.carts.find(c => c.id === cartId)!;
            const existing = cart.items.find(i => i.uuid === product.uuid);
            if (existing) {
                existing.cartQuantity += quantity;
                existing.flash = true;
            } else {
                cart.items.push({ ...product, cartQuantity: quantity, flash: true });
            }
            state.activeCartId = cartId;
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

        resetStore: () => set({
            profile: null,
            products: [],
            customers: [],
            suppliers: [],
            expenses: [],
            salesHistory: [],
            returns: [],
            stockIntakes: [],
            breadOrders: [],
            recipes: [],
            zakatHistory: [],
            carts: [createInitialCart()],
            activeCartId: '',
            lastCompletedSale: null,
        }),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useIsManagerOrAdmin = () => true;
