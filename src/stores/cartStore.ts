import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Cart, Customer, Product } from '@/lib/types';
import { cartService, customerService, draftService } from '@/services';
import { CART_ID } from '@/services/cart.service';
import { toast } from 'sonner';

interface CartState {
    cart: Cart | null;
    customer: Customer | null;
    isLoading: boolean;
    actions: {
        initCart: () => Promise<void>;
        addProductToCart: (product: Product, quantity: number) => Promise<void>;
        updateCartItemQuantity: (itemId: number | string, newQuantity: number) => Promise<void>;
        removeCartItem: (itemId: number | string) => Promise<void>;
        clearCart: () => Promise<void>;
        setCartCustomer: (customer: Customer | null) => Promise<void>;
        setCartDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => Promise<void>;
        saveCartAsDraft: () => Promise<void>;
        loadDraftToCart: (draftId: number) => Promise<void>;
        _internal_refetchCart: () => Promise<void>;
    }
}

export const useCartStore = create<CartState>()(
    immer((set, get) => ({
        cart: null,
        customer: null,
        isLoading: true,
        actions: {
            initCart: async () => {
                set({ isLoading: true });
                await cartService.initCart();
                await get().actions._internal_refetchCart();
                set({ isLoading: false });
            },
            addProductToCart: async (product, quantity) => {
                await cartService.addProductToCart(CART_ID, product, quantity);
                await get().actions._internal_refetchCart();
                // We need to remove the flash after a short delay
                setTimeout(async () => {
                    await cartService.removeFlashFromCartItems(CART_ID);
                     await get().actions._internal_refetchCart();
                }, 500);
            },
            updateCartItemQuantity: async (itemId, newQuantity) => {
                const result = await cartService.updateCartItemQuantity(CART_ID, itemId, newQuantity);
                if (result.capped) {
                    toast.warning(`La quantité a été limitée à ${result.maxQuantity} (stock disponible).`);
                }
                await get().actions._internal_refetchCart();
            },
            removeCartItem: async (itemId) => {
                await cartService.removeCartItem(CART_ID, itemId);
                await get().actions._internal_refetchCart();
            },
            clearCart: async () => {
                await cartService.clearCart(CART_ID);
                toast.info("Le panier a été vidé.");
                await get().actions._internal_refetchCart();
            },
            setCartCustomer: async (customer) => {
                await cartService.setCartCustomer(CART_ID, customer);
                await get().actions._internal_refetchCart();
            },
            setCartDiscount: async (discount) => {
                await cartService.setCartDiscount(CART_ID, discount);
                await get().actions._internal_refetchCart();
            },
            saveCartAsDraft: async () => {
                const cart = get().cart;
                if (!cart) return;
                await draftService.saveCartAsDraft(cart);
            },
            loadDraftToCart: async (draftId) => {
                await draftService.loadDraftToCart(draftId, CART_ID);
                await get().actions._internal_refetchCart();
            },
             // Private action to refetch and update state
            _internal_refetchCart: async () => {
                const cart = await cartService.getCart(CART_ID);
                let customer: Customer | null = null;
                if (cart?.customerUuid) {
                    customer = await customerService.getCustomerByUuid(cart.customerUuid) ?? null;
                }
                set({ cart, customer });
            },
        }
    }))
);

// We can extract actions to avoid re-renders of components that only use actions.
export const useCartActions = () => useCartStore((state) => state.actions);
