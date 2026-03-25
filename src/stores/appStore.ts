import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, Customer, CompanyProfile, Product, CartItem, ReturnItem, StockIntakeItem } from '@/lib/types';
import { toast } from 'sonner';

import { authService } from '@/services/auth.service';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
import { profileService } from '@/services/profile.service';
import { returnService } from '@/services/return.service';
import { supplierService } from '@/services/supplier.service';
import { stockService } from '@/services/stock.service';

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
    }) => Promise<boolean>;
    processReturn: (returnData: {
        originalSaleUuid: string,
        items: ReturnItem[],
        totalReturnValue: number,
        amountRefunded: number,
        customerUuid?: string,
        notes?: string
    }) => Promise<boolean>;
    processStockIntake: (intakeData: {
        supplierName: string,
        supplierUuid?: string,
        invoiceNumber: string,
        invoiceDate: Date,
        items: StockIntakeItem[],
        totalValue: number
    }) => Promise<boolean>;
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
            await authService.signIn(email, password);
        },
        signUp: async (email, password) => {
            await authService.signUp(email, password);
        },
        signOut: async () => {
            await authService.signOut();
            set({ session: null, user: null, profile: null, cart: initialCart, cartCustomer: null });
        },
        fetchProfile: async () => {
            if (get().profile) return; // Fetch only once
            try {
                set({ isSettingsLoading: true });
                const profile = await profileService.getProfile();
                set({ profile });
            } catch (error: any) {
                toast.error("Impossible de charger le profil de l'entreprise.", { description: error.message });
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
            if (cart.items.length === 0) {
                toast.error("Le panier est vide.");
                return false;
            }

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
                toast.success("Vente finalisée avec succès !");
                return true;
            } catch (error: any) {
                toast.error("Échec de la finalisation de la vente", { description: error.message });
                return false;
            }
        },
        processReturn: async (returnData) => {
             try {
                const newReturn = await returnService.addReturn(returnData);
                for (const item of newReturn.items) {
                    if (item.wasRestocked && item.productUuid) {
                        await inventoryService.adjustStock(item.productUuid, item.quantity, 'return', newReturn.uuid);
                    }
                }
                if (newReturn.customerUuid) {
                    await customerService.recalculateCustomerStatus(newReturn.customerUuid);
                }
                toast.success("Retour de produit enregistré avec succès.");
                return true;
            } catch (error: any) {
                toast.error("Échec du traitement du retour.", { description: error.message });
                return false;
            }
        },
        processStockIntake: async (intakeData) => {
            try {
                const supplier = await supplierService.findOrCreateSupplier(intakeData.supplierName, intakeData.supplierUuid);

                const finalItems = [];
                for (const item of intakeData.items) {
                    let productUuid = item.productUuid;
                    if (item.isNew) {
                        const newProduct = await productService.addProduct({
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            purchasePrice: item.purchasePrice,
                            quantity: 0, // Initial quantity is 0, will be adjusted by inventory service
                            minStockLevel: 10,
                            supplierUuid: supplier.uuid,
                        });
                        productUuid = newProduct.uuid;
                    } else {
                        // Update product purchase price if it has changed
                        const p = await inventoryService.getProductInfo(productUuid!);
                        if (p && p.purchasePrice !== item.purchasePrice) {
                            await productService.updateProduct(p.uuid, { purchasePrice: item.purchasePrice, dateMajPrix: new Date() });
                        }
                    }

                    if (productUuid) {
                        const quantityReceived = item.quantity - item.quantityDamaged;
                        if (quantityReceived > 0) {
                            await inventoryService.adjustStock(productUuid, quantityReceived, 'stock_intake');
                        }
                        finalItems.push({
                            productUuid: productUuid,
                            productName: item.name,
                            quantityReceived: item.quantity,
                            quantityDamaged: item.quantityDamaged,
                            purchasePrice: item.purchasePrice,
                        });
                    }
                }

                await stockService.addStockIntake({
                    supplierUuid: supplier.uuid,
                    invoiceNumber: intakeData.invoiceNumber,
                    invoiceDate: intakeData.invoiceDate,
                    items: finalItems,
                    totalValue: intakeData.totalValue,
                });
                toast.success("Réception de stock enregistrée avec succès.");
                return true;
            } catch (error: any) {
                toast.error("Échec du traitement de la réception de stock.", { description: error.message });
                return false;
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
