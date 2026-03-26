
import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, Customer, CompanyProfile, Product, CartItem, ReturnItem, StockIntakeItem, Sale } from '@/lib/types';
import { toast } from 'sonner';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import { authService } from '@/services/auth.service';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { inventoryService } from '@/services/inventory.service';
import { profileService } from '@/services/profile.service';
import { returnService } from '@/services/return.service';
import { supplierService } from '@/services/supplier.service';
import { stockService } from '@/services/stock.service';
import { productService } from '@/services/product.service';

// Main State Interface
interface AppState {
    session: Session | null;
    sessionLoading: boolean;
    user: User | null;
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    
    // Carts and Drafts
    carts: Cart[];
    activeCartId: string;

    productViewMode: 'grid' | 'list';
    lastCompletedSale: { sale: Sale; customer: Customer | null } | null;
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
    updateCartItemPrice: (productUuid: string, newPrice: number) => void;
    removeCartItem: (productUuid: string) => void;
    clearCartFlashes: () => void;
    setCartCustomer: (customer: Customer | null) => void;
    setCartDiscount: (discount: { type: 'fixed' | 'percentage'; value: number }) => void;
    clearCart: () => void;
    
    // Draft management
    createNewCart: () => void;
    switchToCart: (cartId: string) => void;
    saveActiveCartAsDraft: (name: string) => void;
    deleteCart: (cartId: string) => void;

    finalizeSale: (paymentData: {
        amountPaid: number;
        payments: { method: 'cash' | 'card' | 'other'; amount: number }[];
        dueDate?: Date;
    }) => Promise<boolean>;
    clearLastCompletedSale: () => void;
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
const defaultCartId = uuidv4();
const initialCart: Cart = {
    id: defaultCartId,
    name: 'Panier 1',
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
    carts: [initialCart],
    activeCartId: defaultCartId,
    productViewMode: 'grid',
    lastCompletedSale: null,
};

// Store Implementation
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                setSession: (session) => set({ session, user: session?.user ?? null, sessionLoading: false }),
                signIn: async (email, password) => {
                    const session = await authService.signIn(email, password);
                    set({ session, user: session?.user ?? null, sessionLoading: false });
                },
                signUp: async (email, password) => {
                    const session = await authService.signUp(email, password);
                    set({ session, user: session?.user ?? null, sessionLoading: false });
                },
                signOut: async () => {
                    await authService.signOut();
                    set({ ...initialState, session: null, user: null, profile: null, sessionLoading: false });
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
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (!activeCart) return;

                    const existingItem = activeCart.items.find(item => item.uuid === product.uuid);
                    if (product.uuid.startsWith('custom-')) {
                         activeCart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
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
                        activeCart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
                    }
                })),
                updateCartItemQuantity: (productUuid, newQuantity) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (!activeCart) return;

                    const item = activeCart.items.find(i => i.uuid === productUuid);
                    if (item) {
                        if (newQuantity <= 0) {
                            activeCart.items = activeCart.items.filter(i => i.uuid !== productUuid);
                        } else if (!item.uuid.startsWith('custom-') && newQuantity > item.quantity) {
                             throw new Error(`Quantité en stock insuffisante pour ${item.name}. Disponible: ${item.quantity}`);
                        } else {
                            item.cartQuantity = newQuantity;
                        }
                    }
                })),
                updateCartItemPrice: (productUuid, newPrice) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (!activeCart) return;

                    const item = activeCart.items.find(i => i.uuid === productUuid);
                    if (item) {
                        if (newPrice < 0) {
                            toast.error("Le prix ne peut pas être négatif.");
                            return;
                        }
                        item.price = newPrice;
                        if (item.purchasePrice > 0 && newPrice < item.purchasePrice) {
                            toast.warning(`Vente à perte : Le prix de "${item.name}" est inférieur au prix d'achat.`);
                        }
                    }
                })),
                removeCartItem: (productUuid) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.items = activeCart.items.filter(item => item.uuid !== productUuid);
                    }
                })),
                clearCartFlashes: () => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.items.forEach(item => {
                            if (item.flash) {
                                delete item.flash;
                            }
                        });
                    }
                })),
                setCartCustomer: (customer) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.customerUuid = customer?.uuid || null;
                    }
                })),
                setCartDiscount: (discount) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.discount = discount;
                    }
                })),
                clearCart: () => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.items = [];
                        activeCart.discount = { type: 'fixed', value: 0 };
                    }
                })),
                createNewCart: () => set(produce((state: AppState) => {
                    const newCartName = `Panier ${state.carts.length + 1}`;
                    const newCartId = uuidv4();
                    const newCart: Cart = {
                        id: newCartId,
                        name: newCartName,
                        items: [],
                        customerUuid: null,
                        discount: { type: 'fixed', value: 0 },
                    };
                    state.carts.push(newCart);
                    state.activeCartId = newCartId;
                })),
                switchToCart: (cartId: string) => set({ activeCartId: cartId }),
                saveActiveCartAsDraft: (name: string) => set(produce((state: AppState) => {
                    const activeCart = state.carts.find(c => c.id === state.activeCartId);
                    if (activeCart) {
                        activeCart.name = name;
                    }
                })),
                deleteCart: (cartId: string) => set(produce((state: AppState) => {
                    const isDeletingActive = state.activeCartId === cartId;
                    state.carts = state.carts.filter(c => c.id !== cartId);
                    
                    if (state.carts.length === 0) {
                        const newCartId = uuidv4();
                        state.carts.push({ id: newCartId, name: 'Panier 1', items: [], customerUuid: null, discount: { type: 'fixed', value: 0 } });
                        state.activeCartId = newCartId;
                    } else if (isDeletingActive) {
                        state.activeCartId = state.carts[0].id;
                    }
                })),
                finalizeSale: async (paymentData) => {
                    const { carts, activeCartId, actions } = get();
                    const activeCart = carts.find(c => c.id === activeCartId);

                    if (!activeCart || activeCart.items.length === 0) {
                        toast.error("Le panier est vide.");
                        return false;
                    }
        
                    const cartCustomer = activeCart.customerUuid 
                        ? await customerService.getCustomerByUuid(activeCart.customerUuid)
                        : null;

                    try {
                        const sale = await salesService.createSale({
                            items: activeCart.items,
                            discountType: activeCart.discount.type,
                            discountValue: activeCart.discount.value,
                            ...paymentData,
                            customerUuid: activeCart.customerUuid,
                        });
                        
                        set({ lastCompletedSale: { sale, customer: cartCustomer } });
        
                        for (const item of sale.items) {
                            await inventoryService.adjustStock(item.productUuid, -item.quantity, 'sale', sale.uuid);
                        }
        
                        if (sale.customerUuid) {
                            await customerService.recalculateCustomerStatus(sale.customerUuid);
                        }
        
                        actions.deleteCart(activeCartId);
                        toast.success("Vente finalisée avec succès !");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec de la finalisation de la vente", { description: error.message });
                        return false;
                    }
                },
                clearLastCompletedSale: () => set({ lastCompletedSale: null }),
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
                                    unite: item.unite,
                                    barcodes: item.barcodes,
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
                        
                        await supplierService.updateSupplierBalance(supplier.uuid, intakeData.totalValue);

                        toast.success("Réception de stock enregistrée et solde fournisseur mis à jour.");
                        return true;
                    } catch (error: any) {
                        toast.error("Échec du traitement de la réception de stock.", { description: error.message });
                        return false;
                    }
                },
                setProductViewMode: (mode) => set({ productViewMode: mode }),
            }
        }),
        {
          name: 'ipos-sell-store',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({ 
              carts: state.carts, 
              activeCartId: state.activeCartId,
              productViewMode: state.productViewMode
          }),
          onRehydrateStorage: () => (state) => {
              if (state) {
                  state.sessionLoading = false;
              }
          },
        }
    )
);

// Convenience hooks
export const useAppActions = () => useAppStore((state) => state.actions);

export const useIsManagerOrAdmin = () => {
    const role = useAppStore(state => state.profile?.role);
    return role === 'admin' || role === 'manager';
};
