
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Cart, Customer, Product, CompanyProfile } from '@/lib/types';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { customerService } from '@/services/customer.service';
import { profileService } from '@/services/profile.service';
import { salesService } from '@/services/sales.service';
import { inventoryService } from '@/services/inventory.service';
import type { Session } from '@supabase/supabase-js';

type ViewMode = 'grid' | 'list';

// Define the state structure
interface AppState {
    // Session Slice
    session: Session | null;
    user: Session['user'] | null;
    sessionLoading: boolean;

    // Cart Slice
    cart: Cart;
    cartCustomer: Customer | null;
    isCartLoading: boolean; // Retained for potential async cart ops

    // Settings Slice
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;

    // UI State Slice
    productViewMode: ViewMode;

    // Actions
    actions: {
        // Session Actions
        setSession: (session: Session | null) => void;
        signIn: (email: string, password?: string) => Promise<void>;
        signUp: (email: string, password?: string) => Promise<void>;
        signOut: () => Promise<void>;

        // Data Actions (These are high-level actions that might interact with services)
        fetchProfile: () => Promise<void>;
        updateProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;

        // Cart Actions
        addProductToCart: (product: Product, quantity: number) => void;
        updateCartItemQuantity: (itemUuid: string, newQuantity: number) => void;
        removeCartItem: (itemUuid: string) => void;
        clearCart: () => void;
        setCartCustomer: (customer: Customer | null) => void;
        setCartDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
        
        // Sale Finalization
        finalizeSale: (saleData: {
            amountPaid: number,
            payments: { method: 'cash' | 'card' | 'other', amount: number }[],
            dueDate?: Date,
        }) => Promise<void>;

        // UI Actions
        setProductViewMode: (mode: ViewMode) => void;
    }
}

const initialCartState: Omit<Cart, 'customerUuid'> = {
    id: 'default-cart',
    name: 'Panier Principal',
    items: [],
    discount: { type: 'fixed', value: 0 },
};

// Create the single, unified store
export const useAppStore = create<AppState>()(
    immer((set, get) => ({
        // Initial State
        session: null,
        user: null,
        sessionLoading: true,
        cart: {
            ...initialCartState,
            customerUuid: null,
        },
        cartCustomer: null,
        isCartLoading: false,
        profile: null,
        isSettingsLoading: true,
        productViewMode: 'grid',

        // Actions Implementation
        actions: {
            // == SESSION ACTIONS ==
            setSession: (session) => {
                set({ session, user: session?.user ?? null, sessionLoading: false });
            },
            signIn: async (email, password) => {
                const session = await authService.signIn(email, password);
                set({ session, user: session?.user ?? null });
            },
             signUp: async (email, password) => {
                const session = await authService.signUp(email, password);
                set({ session, user: session?.user ?? null });
            },
            signOut: async () => {
                await authService.signOut();
                set({ session: null, user: null, profile: null, cart: { ...initialCartState, customerUuid: null }, cartCustomer: null });
            },
            
            // == DATA ACTIONS ==
            fetchProfile: async () => {
                set({ isSettingsLoading: true });
                try {
                    const profile = await profileService.getProfile();
                    set({ profile, isSettingsLoading: false });
                } catch (error) {
                    toast.error("Impossible de charger le profil de l'entreprise.");
                    set({ isSettingsLoading: false });
                }
            },
            updateProfile: async (profileData) => {
                const updatedProfile = await profileService.updateProfile(profileData);
                set({ profile: updatedProfile });
            },

            // == CART ACTIONS ==
            addProductToCart: (product, quantity) => {
                set(state => {
                    const existingItem = state.cart.items.find(item => item.uuid === product.uuid);
                    if (existingItem) {
                        const newQuantity = existingItem.cartQuantity + quantity;
                        if (product.quantity !== Infinity && newQuantity > product.quantity) {
                            toast.warning(`Stock insuffisant. Quantité limitée à ${product.quantity}.`);
                            existingItem.cartQuantity = product.quantity;
                        } else {
                            existingItem.cartQuantity = newQuantity;
                        }
                        existingItem.flash = true;
                    } else {
                        const newCartItem = { ...product, cartQuantity: quantity > product.quantity ? product.quantity : quantity, flash: true };
                         if (quantity > product.quantity && product.quantity !== Infinity) {
                             toast.warning(`Stock insuffisant. Quantité limitée à ${product.quantity}.`);
                        }
                        state.cart.items.unshift(newCartItem);
                    }
                });
                setTimeout(() => {
                    set(state => {
                        state.cart.items.forEach(item => item.flash = false);
                    });
                }, 500);
            },
            
            updateCartItemQuantity: (itemUuid, newQuantity) => {
                set(state => {
                    const itemToUpdate = state.cart.items.find(item => item.uuid === itemUuid);
                    if (itemToUpdate) {
                        if (newQuantity > 0) {
                            if (itemToUpdate.quantity !== Infinity && newQuantity > itemToUpdate.quantity) {
                                toast.warning(`La quantité a été limitée à ${itemToUpdate.quantity} (stock disponible).`);
                                itemToUpdate.cartQuantity = itemToUpdate.quantity;
                            } else {
                                itemToUpdate.cartQuantity = newQuantity;
                            }
                        } else {
                            state.cart.items = state.cart.items.filter(item => item.uuid !== itemUuid);
                        }
                    }
                });
            },
            
            removeCartItem: (itemUuid) => {
                set(state => {
                    state.cart.items = state.cart.items.filter(item => item.uuid !== itemUuid);
                });
            },

            clearCart: () => {
                set(state => {
                    // Reset only items and discount, preserve the customer selection
                    state.cart.items = [];
                    state.cart.discount = { type: 'fixed', value: 0 };
                });
                toast.info("Le panier a été vidé.");
            },

            setCartCustomer: (customer) => {
                set(state => {
                    state.cart.customerUuid = customer?.uuid ?? null;
                    state.cartCustomer = customer;
                });
            },
            
            setCartDiscount: (discount) => {
                set(state => {
                    state.cart.discount = discount;
                });
            },
            
            // == SALE FINALIZATION (ORCHESTRATION) ==
            finalizeSale: async (saleData) => {
                const { cart, cartCustomer } = get();

                // 1. Create the sale.
                const sale = await salesService.createSale({
                    ...saleData,
                    items: cart.items,
                    discountType: cart.discount.type,
                    discountValue: cart.discount.value,
                    customerUuid: cart.customerUuid,
                });

                // 2. Adjust inventory for each item sold.
                for (const item of cart.items) {
                    // Only adjust stock for real products, not custom ones.
                    if (item.user_id !== 'custom') { 
                        await inventoryService.adjustStock(item.uuid, -item.cartQuantity, 'sale', sale.uuid);
                    }
                }
                
                // 3. Recalculate customer status if a customer was associated.
                if (sale.customerUuid) {
                    const updatedCustomer = await customerService.recalculateCustomerStatus(sale.customerUuid);
                    // Update customer in the store if it's the current one
                    if (cartCustomer && cartCustomer.uuid === updatedCustomer.uuid) {
                        set({ cartCustomer: updatedCustomer });
                    }
                }
                
                // 4. Reset cart.
                get().actions.clearCart();
            },

            // == UI ACTIONS ==
            setProductViewMode: (mode: ViewMode) => {
                set({ productViewMode: mode });
            }
        }
    }))
);

// This allows non-component files to call actions
export const useAppActions = useAppStore.getState().actions;
