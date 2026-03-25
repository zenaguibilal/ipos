
import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, Customer, CompanyProfile, AppRole, Product, CartItem } from '@/lib/types';
import { toast } from 'sonner';

import { authService } from '@/services/auth.service';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
import { profileService } from '@/services/profile.service';

// Main State Interface
interface AppState {
    session: Session | null;
    sessionLoading: boolean;
    user: User | null;
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    cart: Cart;
    cartCustomer: Customer | null;
    isCartLoading: boolean;
    productViewMode: 'grid' | 'list';
    actions: AppActions;
}

// Actions Interface
interface AppActions {
    setSession: (session: Session | null) => void;
    signIn: (email: string, password?: string) => Promise<void>;
    signUp: (email: string, password?: string) => Promise<void>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
    addProductToCart: (product: Product, quantity: number) => void;
    updateCartItemQuantity: (productUuid: string, newQuantity: number) => void;
    removeCartItem: (productUuid: string) => void;
    setCartCustomer: (customer: Customer | null) => void;
    setCartDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
    clearCart: () => void;
    finalizeSale: (paymentData: {
        amountPaid: number;
        payments: { method: 'cash' | 'card' | 'other'; amount: number }[];
        dueDate?: Date;
    }) => Promise<void>;
    setProductViewMode: (mode: 'grid' | 'list') => void;
}

// Initial State
const initialCart: Cart = {
    id: 'main',
    name: 'Panier Actif',
    items: [],
    customerUuid: null,
    discount: { type: 'fixed', value: 0 },
};

const initialState: Omit<AppState, 'actions'> = {
    session: null,
    sessionLoading: true,
    user: null,
    profile: null,
    isSettingsLoading: true,
    cart: initialCart,
    cartCustomer: null,
    isCartLoading: false,
    productViewMode: 'grid',
};

// Store Implementation
export const useAppStore = create<AppState>()((set, get) => ({
    ...initialState,
    actions: {
        setSession: (session) => set({ session, user: session?.user ?? null, sessionLoading: false }),
        signIn: async (email, password) => {
            try {
                await authService.signIn(email, password);
            } catch (error: any) {
                toast.error(error.message || "La connexion a échoué.");
                throw error;
            }
        },
        signUp: async (email, password) => {
            try {
                await authService.signUp(email, password);
            } catch (error: any) {
                toast.error(error.message || "L'inscription a échoué.");
                throw error;
            }
        },
        signOut: async () => {
            try {
                await authService.signOut();
                set({ session: null, user: null, profile: null, cart: initialCart, cartCustomer: null });
            } catch (error: any) {
                toast.error(error.message || "La déconnexion a échoué.");
                throw error;
            }
        },
        fetchProfile: async () => {
            if (get().profile) return; // Fetch only once
            try {
                set({ isSettingsLoading: true });
                const profile = await profileService.getProfile();
                set({ profile });
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                set({ isSettingsLoading: false });
            }
        },
        updateProfile: async (profileData) => {
            const updatedProfile = await profileService.updateProfile(profileData);
            set({ profile: updatedProfile });
        },
        addProductToCart: (product, quantity) => set(produce((state: AppState) => {
            const existingItem = state.cart.items.find(item => item.uuid === product.uuid);
            if (product.uuid.startsWith('custom-')) { // Handle custom products
                 state.cart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
                 return;
            }
            
            if (existingItem) {
                const newQuantity = existingItem.cartQuantity + quantity;
                if (newQuantity > existingItem.quantity) {
                    throw new Error(`Quantité en stock insuffisante pour ${product.name}. Disponible: ${existingItem.quantity}`);
                }
                existingItem.cartQuantity = newQuantity;
                existingItem.flash = true;
            } else {
                if (quantity > product.quantity) {
                   throw new Error(`Quantité en stock insuffisante pour ${product.name}. Disponible: ${product.quantity}`);
                }
                state.cart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
            }
        })),
        updateCartItemQuantity: (productUuid, newQuantity) => set(produce((state: AppState) => {
             const item = state.cart.items.find(i => i.uuid === productUuid);
            if (item) {
                if (newQuantity <= 0) {
                    state.cart.items = state.cart.items.filter(i => i.uuid !== productUuid);
                } else if (!item.uuid.startsWith('custom-') && newQuantity > item.quantity) {
                     throw new Error(`Quantité en stock insuffisante pour ${item.name}. Disponible: ${item.quantity}`);
                } else {
                    item.cartQuantity = newQuantity;
                }
            }
        })),
        removeCartItem: (productUuid) => set(produce((state: AppState) => {
            state.cart.items = state.cart.items.filter(item => item.uuid !== productUuid);
        })),
        setCartCustomer: (customer) => set(produce((state: AppState) => {
            state.cartCustomer = customer;
            state.cart.customerUuid = customer?.uuid || null;
        })),
        setCartDiscount: (discount) => set(produce((state: AppState) => {
            state.cart.discount = discount;
        })),
        clearCart: () => set(produce((state: AppState) => {
            state.cart.items = [];
            state.cart.discount = { type: 'fixed', value: 0 };
        })),
        finalizeSale: async (paymentData) => {
            const { cart } = get();
            if (cart.items.length === 0) throw new Error("Le panier est vide.");

            try {
                const sale = await salesService.createSale({
                    items: cart.items,
                    discountType: cart.discount.type,
                    discountValue: cart.discount.value,
                    ...paymentData,
                    customerUuid: cart.customerUuid,
                });

                for (const item of sale.items) {
                    await inventoryService.adjustStock(item.productUuid, -item.quantity, 'sale', sale.uuid);
                }

                if (sale.customerUuid) {
                    const updatedCustomer = await customerService.recalculateCustomerStatus(sale.customerUuid);
                    set({ cartCustomer: updatedCustomer });
                }

                get().actions.clearCart();
            } catch (error: any) {
                console.error("Failed to finalize sale:", error);
                toast.error("Échec de la finalisation de la vente", { description: error.message });
                throw error;
            }
        },
        setProductViewMode: (mode) => set({ productViewMode: mode }),
    }
}));

// Convenience hooks
export const useAppActions = () => useAppStore((state) => state.actions);

export const useIsManagerOrAdmin = () => {
    const role = useAppStore(state => state.profile?.role);
    return role === 'admin' || role === 'manager';
};
