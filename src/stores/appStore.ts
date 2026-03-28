
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { 
    Cart, CompanyProfile, Product, Sale, Customer, Supplier, 
    Expense, BreadOrder, Recipe, SavedZakatCalculation, AppRole, StaffMember 
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';
import { calculateZakat } from '@/lib/utils';

interface AppState {
    user: any | null;
    profile: CompanyProfile | null;
    isAuthenticated: boolean;
    isSettingsLoading: boolean;
    isInitialized: boolean;
    
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    expenses: Expense[];
    breadOrders: BreadOrder[];
    recipes: Recipe[];
    staff: StaffMember[];
    zakatHistory: SavedZakatCalculation[];
    
    selectedCustomer: { data: Customer | null; stats: any; activity: any[] };
    selectedSupplier: { data: Supplier | null; stats: any; activity: any[]; products: Product[] };

    zakat: {
        autoData: { inventoryValue: number; customerDebts: number; supplierDebts: number; goldPrice: number };
        inputs: { cashOnHand: number; otherDebts: number };
        result: any;
    };
    
    sellPage: { cartCustomer: Customer | null; customerListVersion: number };

    isLoading: Record<string, boolean>;
    
    productViewMode: 'grid' | 'list';
    customerViewMode: 'grid' | 'list';
    expenseViewMode: 'grid' | 'list';
    salesHistoryViewMode: 'grid' | 'list';
    supplierViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';

    carts: Cart[];
    activeCartId: string;
    lastCompletedSale: { sale: Sale; customer?: Customer } | null;

    modals: {
        sell: {
            isProductSheetOpen: boolean;
            isDebtPaymentDialogOpen: boolean;
            isCustomerDialogOpen: boolean;
            isPaymentDialogOpen: boolean;
        }
    };

    actions: {
        setAuth: (user: any | null) => void;
        fetchProfile: () => Promise<void>;
        updateProfile: (data: Partial<CompanyProfile>) => Promise<void>;
        logout: () => Promise<void>;
        
        refreshProducts: (search?: string) => Promise<void>;
        refreshCustomers: () => Promise<void>;
        refreshSuppliers: () => Promise<void>;
        refreshExpenses: (params?: any) => Promise<void>;
        refreshBreadOrders: (date: string) => Promise<void>;
        refreshRecipes: () => Promise<void>;
        refreshStaff: () => Promise<void>;
        
        refreshZakatData: () => Promise<void>;
        setZakatInputs: (inputs: { cashOnHand?: number; otherDebts?: number }) => void;
        saveZakatCalculation: (result: any) => Promise<void>;

        fetchCustomerDetails: (uuid: string) => Promise<void>;
        fetchSupplierDetails: (uuid: string) => Promise<void>;
        
        setProductViewMode: (mode: 'grid' | 'list') => void;
        setCustomerViewMode: (mode: 'grid' | 'list') => void;
        setExpenseViewMode: (mode: 'grid' | 'list') => void;
        setSalesHistoryViewMode: (mode: 'grid' | 'list') => void;
        setSupplierViewMode: (mode: 'grid' | 'list') => void;
        setStockViewMode: (mode: 'grid' | 'list') => void;

        toggleSellProductSheet: (open: boolean) => void;
        toggleSellDebtPayment: (open: boolean) => void;
        toggleSellCustomerDialog: (open: boolean) => void;
        toggleSellPaymentDialog: (open: boolean) => void;

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
        
        refreshSellCustomer: () => Promise<void>;
        incrementCustomerListVersion: () => void;

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
    user: null,
    profile: null,
    isAuthenticated: false,
    isSettingsLoading: false,
    isInitialized: false,
    
    products: [],
    customers: [],
    suppliers: [],
    expenses: [],
    breadOrders: [],
    recipes: [],
    staff: [],
    zakatHistory: [],
    
    selectedCustomer: { data: null, stats: null, activity: [] },
    selectedSupplier: { data: null, stats: null, activity: [], products: [] },

    zakat: {
        autoData: { inventoryValue: 0, customerDebts: 0, supplierDebts: 0, goldPrice: 0 },
        inputs: { cashOnHand: 0, otherDebts: 0 },
        result: null
    },
    sellPage: { cartCustomer: null, customerListVersion: 0 },

    carts: [createInitialCart()],
    activeCartId: '',
    lastCompletedSale: null,
    isLoading: {},

    productViewMode: 'grid',
    customerViewMode: 'grid',
    expenseViewMode: 'list',
    salesHistoryViewMode: 'list',
    supplierViewMode: 'grid',
    stockViewMode: 'list',

    modals: {
        sell: {
            isProductSheetOpen: false,
            isDebtPaymentDialogOpen: false,
            isCustomerDialogOpen: false,
            isPaymentDialogOpen: false,
        }
    },

    actions: {
        setAuth: (user) => set({ user, isAuthenticated: !!user, activeCartId: get().carts[0].id }),

        fetchProfile: async () => {
            set({ isSettingsLoading: true });
            try {
                const profile = await api.get<CompanyProfile>('profile');
                set({ profile, isInitialized: true });
            } catch (e) {
                console.error("Profile fetch failed:", e);
            } finally {
                set({ isSettingsLoading: false });
            }
        },

        updateProfile: async (data) => {
            const updated = await api.put<CompanyProfile>('profile', data);
            set({ profile: updated });
        },

        logout: async () => {
            try {
                await api.post('auth/signout', {});
            } finally {
                get().actions.resetStore();
                window.location.href = '/login';
            }
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
            } catch (e) { set({ expenses: [] }); }
            finally {
                set(p => ({ isLoading: { ...p.isLoading, expenses: false } }));
            }
        },

        refreshBreadOrders: async (date) => {
            set(p => ({ isLoading: { ...p.isLoading, bread: true } }));
            try {
                const breadOrders = await api.get<BreadOrder[]>(`bread?date=${date}`);
                set({ breadOrders });
            } catch (e) { set({ breadOrders: [] }); }
            finally {
                set(p => ({ isLoading: { ...p.isLoading, bread: false } }));
            }
        },

        refreshRecipes: async () => {
            set(p => ({ isLoading: { ...p.isLoading, recipes: true } }));
            try {
                const recipes = await api.get<Recipe[]>('recipes');
                set({ recipes });
            } catch (e) { set({ recipes: [] }); }
            finally {
                set(p => ({ isLoading: { ...p.isLoading, recipes: false } }));
            }
        },

        refreshStaff: async () => {
            set(p => ({ isLoading: { ...p.isLoading, staff: true } }));
            try {
                const staff = await api.get<StaffMember[]>('staff');
                set({ staff });
            } catch (e) { set({ staff: [] }); }
            finally {
                set(p => ({ isLoading: { ...p.isLoading, staff: false } }));
            }
        },

        refreshZakatData: async () => {
            set(p => ({ isLoading: { ...p.isLoading, zakat: true } }));
            try {
                const [autoData, history] = await Promise.all([
                    api.get<any>('zakat'),
                    api.get<SavedZakatCalculation[]>('zakat?type=history')
                ]);
                set(produce((s: AppState) => {
                    s.zakat.autoData = autoData;
                    s.zakatHistory = history;
                    s.zakat.result = calculateZakat({ ...autoData, ...s.zakat.inputs });
                }));
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, zakat: false } }));
            }
        },

        setZakatInputs: (inputs) => set(produce((s: AppState) => {
            if (inputs.cashOnHand !== undefined) s.zakat.inputs.cashOnHand = inputs.cashOnHand;
            if (inputs.otherDebts !== undefined) s.zakat.inputs.otherDebts = inputs.otherDebts;
            s.zakat.result = calculateZakat({ ...s.zakat.autoData, ...s.zakat.inputs });
        })),

        saveZakatCalculation: async (result) => {
            set(p => ({ isLoading: { ...p.isLoading, zakatSaving: true } }));
            try {
                await api.post('zakat', result);
                await get().actions.refreshZakatData();
            } finally {
                set(p => ({ isLoading: { ...p.isLoading, zakatSaving: false } }));
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
        setSupplierViewMode: (mode) => set({ supplierViewMode: mode }),
        setStockViewMode: (mode) => set({ stockViewMode: mode }),

        toggleSellProductSheet: (open) => set(produce((s: AppState) => { s.modals.sell.isProductSheetOpen = open; })),
        toggleSellDebtPayment: (open) => set(produce((s: AppState) => { s.modals.sell.isDebtPaymentDialogOpen = open; })),
        toggleSellCustomerDialog: (open) => set(produce((s: AppState) => { s.modals.sell.isCustomerDialogOpen = open; })),
        toggleSellPaymentDialog: (open) => set(produce((s: AppState) => { s.modals.sell.isPaymentDialogOpen = open; })),

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
            state.sellPage.cartCustomer = customer;
        })),

        setCartDiscount: (discount) => set(produce((state: AppState) => {
            const cart = state.carts.find(c => c.id === state.activeCartId);
            if (cart) cart.discount = discount;
        })),

        clearCart: () => set(produce((state: AppState) => {
            const index = state.carts.findIndex(c => c.id === state.activeCartId);
            if (index !== -1) state.carts[index] = { ...createInitialCart(), id: state.activeCartId };
            state.sellPage.cartCustomer = null;
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
                set({ lastCompletedSale: { sale, customer: get().sellPage.cartCustomer || undefined } });
                get().actions.clearCart();
                return true;
            } catch (e: any) { return false; }
        },

        processReturn: async (data) => { await api.post('returns', data); return true; },
        processStockIntake: async (data) => { await api.post('stock', data); return true; },
        clearLastCompletedSale: () => set({ lastCompletedSale: null }),

        refreshSellCustomer: async () => {
            const cart = get().carts.find(c => c.id === get().activeCartId);
            if (cart?.customerUuid) {
                const updated = await api.get<Customer>(`customers/${cart.customerUuid}`);
                set(produce((s: AppState) => { s.sellPage.cartCustomer = updated; }));
            }
        },

        incrementCustomerListVersion: () => set(produce((s: AppState) => { s.sellPage.customerListVersion += 1; })),

        resetStore: () => set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitialized: false,
            products: [],
            customers: [],
            suppliers: [],
            expenses: [],
            breadOrders: [],
            recipes: [],
            staff: [],
            carts: [createInitialCart()],
            activeCartId: '',
            lastCompletedSale: null,
            selectedCustomer: { data: null, stats: null, activity: [] },
            selectedSupplier: { data: null, stats: null, activity: [], products: [] },
            zakat: {
                autoData: { inventoryValue: 0, customerDebts: 0, supplierDebts: 0, goldPrice: 0 },
                inputs: { cashOnHand: 0, otherDebts: 0 },
                result: null
            },
            sellPage: { cartCustomer: null, customerListVersion: 0 },
            isLoading: {}
        }),
    }
}));

export const useAppActions = () => useAppStore(state => state.actions);
export const useAppRole = () => useAppStore(state => state.profile?.role || 'cashier' as AppRole);

export const useIsAdmin = () => {
    const role = useAppRole();
    return role === 'admin';
};

export const useIsManagerOrAdmin = () => {
    const role = useAppRole();
    return role === 'admin' || role === 'manager';
};

export const useIsCashierOnly = () => {
    const role = useAppRole();
    return role === 'cashier';
};
