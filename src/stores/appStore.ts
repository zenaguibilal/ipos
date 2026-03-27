'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { 
    Cart, CompanyProfile, Product, Sale, Customer, Supplier, 
    Expense, StockIntake, BreadOrder, Recipe, SavedZakatCalculation 
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';

/**
 * @fileOverview THE STATE SINGULARITY (DOMINATION MODE)
 * The only source of truth for the application state.
 * Centralizes UI states, data flows, and deterministic computations.
 */

interface AppState {
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    
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
    
    selectedCustomer: { data: Customer | null; stats: any; activity: any[] };
    selectedSupplier: { data: Supplier | null; stats: any; activity: any[]; products: Product[] };

    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;
    isLoading: Record<string, boolean>;
    
    // View Modes (Centralized)
    productViewMode: 'grid' | 'list';
    customerViewMode: 'grid' | 'list';
    expenseViewMode: 'grid' | 'list';
    salesHistoryViewMode: 'grid' | 'list';
    returnViewMode: 'grid' | 'list';
    supplierViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';

    // Global Modal & UI Controls
    modals: {
        sell: {
            isProductSheetOpen: boolean;
            isDebtPaymentDialogOpen: boolean;
            isCustomerDialogOpen: boolean;
        },
        customers: {
            isFormOpen: boolean;
            isDeleteOpen: boolean;
            isPaymentOpen: boolean;
            isStatementOpen: boolean;
        }
    };

    actions: {
        fetchProfile: () => Promise<void>;
        updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
        
        refreshProducts: (search?: string) => Promise<void>;
        refreshCustomers: () => Promise<void>;
        refreshSuppliers: () => Promise<void>;
        refreshExpenses: (params?: any) => Promise<void>;
        refreshSalesHistory: (params?: any) => Promise<void>;
        refreshReturns: (params?: any) => Promise<void>;
        refreshStockIntakes: (params?: any) => Promise<void>;
        refreshBreadOrders: (date: string) => Promise<void>;
        refreshRecipes: () => Promise<void>;
        refreshZakatHistory: () => Promise<void>;

        fetchCustomerDetails: (uuid: string) => Promise<void>;
        fetchSupplierDetails: (uuid: string) => Promise<void>;

        setProductViewMode: (mode: 'grid' | 'list') => void;
        setCustomerViewMode: (mode: 'grid' | 'list') => void;
        setExpenseViewMode: (mode: 'grid' | 'list') => void;
        setSalesHistoryViewMode: (mode: 'grid' | 'list') => void;
        setReturnViewMode: (mode: 'grid' | 'list') => void;
        setSupplierViewMode: (mode: 'grid' | 'list') => void;
        setStockViewMode: (mode: 'grid' | 'list') => void;

        toggleSellProductSheet: (open: boolean) => void;
        toggleSellDebtPayment: (open: boolean) => void;
        toggleSellCustomerDialog: (open: boolean) => void;

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
    
    selectedCustomer: { data: null, stats: null, activity: [] },
    selectedSupplier: { data: null, stats: null, activity: [], products: [] },

    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    isLoading: {},

    productViewMode: 'grid',
    customerViewMode: 'grid',
    expenseViewMode: 'list',
    salesHistoryViewMode: 'list',
    returnViewMode: 'list',
    supplierViewMode: 'grid',
    stockViewMode: 'list',

    modals: {
        sell: {
            isProductSheetOpen: false,
            isDebtPaymentDialogOpen: false,
            isCustomerDialogOpen: false,
        },
        customers: {
            isFormOpen: false,
            isDeleteOpen: false,
            isPaymentOpen: false,
            isStatementOpen: false,
        }
    },

    actions: {
        fetchProfile: async () => {
            set({ isSettingsLoading: true });
            try {
                const profile = await api.get<CompanyProfile>('profile');
                set({ profile, activeCartId: get().carts[0].id });
            } finally {
                set({ isSettingsLoading: false });
            }
        },

        updateProfile: async (data) => {
            const updated = await api.put<CompanyProfile>('profile', data);
            set({ profile: updated });
        },

        refreshProducts: async (search) => {
            set(p => ({ isLoading: { ...p.isLoading, products: true } }));
            try {
                const query = search ? `?query=${encodeURIComponent(search)}` : '';
                const products = await api.get<Product[]>(`products${query}`);
                set({ products });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, products: false } }));
            }
        },

        refreshCustomers: async () => {
            set(p => ({ isLoading: { ...p.isLoading, customers: true } }));
            try {
                const customers = await api.get<Customer[]>('customers');
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
                const query = params ? `?${new URLSearchParams(params).toString()}` : '';
                const expenses = await api.get<Expense[]>(`expenses${query}`);
                set({ expenses });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, expenses: false } }));
            }
        },

        refreshSalesHistory: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, sales: true } }));
            try {
                const query = params ? `?${new URLSearchParams(params).toString()}` : '';
                const salesHistory = await api.get<Sale[]>(`sales${query}`);
                set({ salesHistory });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, sales: false } }));
            }
        },

        refreshReturns: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, returns: true } }));
            try {
                const query = params ? `?${new URLSearchParams(params).toString()}` : '';
                const returns = await api.get<any[]>(`returns${query}`);
                set({ returns });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, returns: false } }));
            }
        },

        refreshStockIntakes: async (params) => {
            set(p => ({ isLoading: { ...p.isLoading, stock: true } }));
            try {
                const query = params ? `?${new URLSearchParams(params).toString()}` : '';
                const stockIntakes = await api.get<StockIntake[]>(`stock${query}`);
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

        fetchCustomerDetails: async (uuid) => {
            set(p => ({ isLoading: { ...p.isLoading, customerDetail: true } }));
            try {
                const [data, stats, activity] = await Promise.all([
                    api.get<Customer>(`customers/${uuid}`),
                    api.get<any>(`customers/${uuid}/stats`),
                    api.get<any[]>(`customers/${uuid}/activity`)
                ]);
                set({ selectedCustomer: { data, stats, activity } });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, customerDetail: false } }));
            }
        },

        fetchSupplierDetails: async (uuid) => {
            set(p => ({ isLoading: { ...p.isLoading, supplierDetail: true } }));
            try {
                const [data, activity, products] = await Promise.all([
                    api.get<Supplier>(`suppliers/${uuid}`),
                    api.get<any[]>(`suppliers/${uuid}/activity`),
                    api.get<Product[]>(`products?supplierUuid=${uuid}`)
                ]);
                const intakes = activity.filter(a => a.type === 'intake');
                const totalBought = intakes.reduce((sum, i) => sum + i.totalValue, 0);
                const stats = { 
                    totalBought, 
                    intakeCount: intakes.length,
                    avgIntake: intakes.length > 0 ? totalBought / intakes.length : 0
                };
                set({ selectedSupplier: { data, stats, activity, products } });
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, supplierDetail: false } }));
            }
        },

        setProductViewMode: (mode) => set({ productViewMode: mode }),
        setCustomerViewMode: (mode) => set({ customerViewMode: mode }),
        setExpenseViewMode: (mode) => set({ expenseViewMode: mode }),
        setSalesHistoryViewMode: (mode) => set({ salesHistoryViewMode: mode }),
        setReturnViewMode: (mode) => set({ returnViewMode: mode }),
        setSupplierViewMode: (mode) => set({ supplierViewMode: mode }),
        setStockViewMode: (mode) => set({ stockViewMode: mode }),

        toggleSellProductSheet: (open) => set(produce((s: AppState) => { s.modals.sell.isProductSheetOpen = open; })),
        toggleSellDebtPayment: (open) => set(produce((s: AppState) => { s.modals.sell.isDebtPaymentDialogOpen = open; })),
        toggleSellCustomerDialog: (open) => set(produce((s: AppState) => { s.modals.sell.isCustomerDialogOpen = open; })),

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
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (!cart) return;
            const existing = cart.items.find(i => i.uuid === product.uuid);
            if (existing) {
                existing.cartQuantity += quantity;
                existing.flash = true;
            } else {
                cart.items.push({ ...product, cartQuantity: quantity, flash: true });
            }
        })),

        removeCartItem: (uuid) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (cart) cart.items = cart.items.filter(i => i.uuid !== uuid);
        })),

        updateCartItemQuantity: (uuid, qty) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            const item = cart?.items.find(i => i.uuid === uuid);
            if (item) item.cartQuantity = Math.max(1, qty);
        })),

        updateCartItemPrice: (uuid, price) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            const item = cart?.items.find(i => i.uuid === uuid);
            if (item) item.price = price;
        })),

        setCartCustomer: (customer) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (cart) cart.customerUuid = customer?.uuid || null;
        })),

        setCartDiscount: (discount) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (cart) cart.discount = discount;
        })),

        clearCart: () => set(produce((state: AppState) => {
            const index = state.carts.findIndex(c => c.id === state.activeCartId);
            if (index !== -1) state.carts[index] = { ...createInitialCart(), id: state.activeCartId };
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
            } catch (e: any) { return false; }
        },

        processReturn: async (data) => { await api.post('returns', data); return true; },
        processStockIntake: async (data) => { await api.post('stock', data); return true; },
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
            selectedCustomer: { data: null, stats: null, activity: [] },
            selectedSupplier: { data: null, stats: null, activity: [], products: [] },
        }),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useIsManagerOrAdmin = () => true;