import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createClient } from '@/utils/supabase/client';
import type { Cart, Customer, Product, CompanyProfile, User } from '@/lib/types';
import { toast } from 'sonner';

// Define the state structure
interface AppState {
    // Session Slice
    session: User | null;
    sessionLoading: boolean;

    // Cart Slice
    cart: Cart;
    cartCustomer: Customer | null;
    isCartLoading: boolean;

    // Settings Slice
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;

    // Actions
    actions: {
        // Session Actions
        initSession: () => void;
        signIn: (email: string, password: string) => Promise<void>;
        signUp: (email: string, password: string) => Promise<void>;
        signOut: () => Promise<void>;

        // Cart Actions
        addProductToCart: (product: Product, quantity: number) => void;
        updateCartItemQuantity: (itemId: number | string, newQuantity: number) => void;
        removeCartItem: (itemId: number | string) => void;
        clearCart: () => void;
        setCartCustomer: (customer: Customer | null) => void;
        setCartDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
    }
}

const initialCartState: Cart = {
    id: 'default-cart',
    name: 'Panier Principal',
    items: [],
    customer_id: null,
    customerName: 'Client de passage',
    discount: { type: 'fixed', value: 0 },
};

// Create the store
export const useAppStore = create<AppState>()(
    immer((set, get) => ({
        // Initial State
        session: null,
        sessionLoading: true,
        cart: initialCartState,
        cartCustomer: null,
        isCartLoading: false, // No async cart loading in this model
        profile: null,
        isSettingsLoading: true,

        // Actions Implementation
        actions: {
            // == SESSION ACTIONS ==
            initSession: () => {
                const supabase = createClient();
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    (_event, session) => {
                        set({ session: session?.user ?? null, sessionLoading: false });
                    }
                );
                return () => subscription.unsubscribe();
            },
            signIn: async (email, password) => {
                const supabase = createClient();
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            },
            signUp: async (email, password) => {
                const supabase = createClient();
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            },
            signOut: async () => {
                const supabase = createClient();
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
            },
            
            // == CART ACTIONS ==
            addProductToCart: (product, quantity) => {
                set(state => {
                    const existingItem = state.cart.items.find(item => item.id === product.id);
                    if (existingItem) {
                        existingItem.cartQuantity += quantity;
                    } else {
                        state.cart.items.push({ ...product, cartQuantity: quantity });
                    }
                });
            },
            
            updateCartItemQuantity: (itemId, newQuantity) => {
                set(state => {
                    const itemToUpdate = state.cart.items.find(item => item.id === itemId);
                    if (itemToUpdate) {
                        if (newQuantity > 0) {
                            if (typeof itemToUpdate.id === 'number' && newQuantity > itemToUpdate.quantity) {
                                toast.warning(`La quantité a été limitée à ${itemToUpdate.quantity} (stock disponible).`);
                                itemToUpdate.cartQuantity = itemToUpdate.quantity;
                            } else {
                                itemToUpdate.cartQuantity = newQuantity;
                            }
                        } else {
                            state.cart.items = state.cart.items.filter(item => item.id !== itemId);
                        }
                    }
                });
            },
            
            removeCartItem: (itemId) => {
                set(state => {
                    state.cart.items = state.cart.items.filter(item => item.id !== itemId);
                });
            },

            clearCart: () => {
                set(state => {
                    state.cart = { ...initialCartState, customer_id: state.cart.customer_id, customerName: state.cart.customerName };
                });
                toast.info("Le panier a été vidé.");
            },

            setCartCustomer: (customer) => {
                set(state => {
                    state.cart.customer_id = customer?.id ?? null;
                    state.cart.customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Client de passage';
                    state.cartCustomer = customer;
                });
            },
            
            setCartDiscount: (discount) => {
                set(state => {
                    state.cart.discount = discount;
                });
            },
        }
    }))
);

export const useAppActions = () => useAppStore((state) => state.actions);
