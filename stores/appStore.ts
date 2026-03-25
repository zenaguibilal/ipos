import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Cart, Customer, Product, CompanyProfile } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { 
    authService,
    customerService, 
    profileService,
    salesService
} from '@/services';

// This is a mock session for the new architecture. It will be replaced by Supabase's user object.
interface Session {
    id: string;
    email: string;
}

// Define the state structure
interface AppState {
    // Session Slice
    session: Session | null;
    sessionLoading: boolean;

    // Cart Slice
    cart: Cart;
    cartCustomer: Customer | null;
    isCartLoading: boolean; // Retained for potential async cart ops

    // Settings Slice
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;

    // Actions
    actions: {
        // Session Actions
        initSession: () => void;
        signIn: (email: string, password: string) => Promise<void>;
        signOut: () => Promise<void>;

        // Data Actions (These are high-level actions that might interact with services)
        fetchCustomers: () => Promise<Customer[]>;
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
    }
}

const initialCartState: Cart = {
    id: 'default-cart',
    name: 'Panier Principal',
    items: [],
    customerUuid: null,
    customerName: 'Client de passage',
    discount: { type: 'fixed', value: 0 },
};

// Create the single, unified store
export const useAppStore = create<AppState>()(
    immer((set, get) => ({
        // Initial State
        session: null,
        sessionLoading: true,
        cart: initialCartState,
        cartCustomer: null,
        isCartLoading: false,
        profile: null,
        isSettingsLoading: true,

        // Actions Implementation
        actions: {
            // == SESSION ACTIONS ==
            initSession: () => {
                const session = authService.getSession();
                set({ session, sessionLoading: false });
            },
            signIn: async (email, password) => {
                const session = await authService.signIn(email, password);
                set({ session });
            },
            signOut: async () => {
                await authService.signOut();
                set({ session: null, cart: initialCartState, cartCustomer: null });
            },
            
            // == DATA ACTIONS ==
            fetchCustomers: async () => {
                // This might be better handled locally on the customers page
                // to avoid loading all customers into global state.
                // For now, we return it as a utility.
                try {
                    return await customerService.getCustomers();
                } catch (error) {
                    toast.error("Impossible de charger les clients.");
                    return [];
                }
            },
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
                    state.cart = initialCartState;
                    // Preserve customer selection
                    state.cart.customerUuid = get().cart.customerUuid;
                    state.cart.customerName = get().cart.customerName;
                });
                toast.info("Le panier a été vidé.");
            },

            setCartCustomer: (customer) => {
                set(state => {
                    state.cart.customerUuid = customer?.uuid ?? null;
                    state.cart.customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                    state.cartCustomer = customer;
                });
            },
            
            setCartDiscount: (discount) => {
                set(state => {
                    state.cart.discount = discount;
                });
            },
            
            // == SALE FINALIZATION ACTION ==
            finalizeSale: async (saleData) => {
                const { cart, cartCustomer } = get();

                const sale = await salesService.createSale({
                    ...saleData,
                    items: cart.items,
                    discountType: cart.discount.type,
                    discountValue: cart.discount.value,
                    customerUuid: cart.customerUuid,
                });
                
                // Recalculate customer status if a customer was associated
                if (sale.customerUuid) {
                    const updatedCustomer = await customerService.recalculateCustomerStatus(sale.customerUuid);
                    // Update customer in the store if it's the current one
                    if (cartCustomer && cartCustomer.uuid === updatedCustomer.uuid) {
                        set({ cartCustomer: updatedCustomer });
                    }
                }
                
                // Reset cart
                get().actions.clearCart();
            }
        }
    }))
);

export const useAppActions = useAppStore.getState().actions;
