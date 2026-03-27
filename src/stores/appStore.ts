
import { create } from 'zustand';
import { produce } from 'immer';
import type { Session, User } from '@supabase/supabase-js';
import type { Cart, Customer, CompanyProfile, Product, CartItem, Sale } from '@/lib/types';
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

interface AppState {
    session: Session | null;
    sessionLoading: boolean;
    user: User | null;
    profile: CompanyProfile | null;
    isSettingsLoading: boolean;
    carts: Cart[];
    activeCartId: string;
    productViewMode: 'grid' | 'list';
    stockViewMode: 'grid' | 'list';
    customerViewMode: 'grid' | 'list';
    supplierViewMode: 'grid' | 'list';
    salesHistoryViewMode: 'grid' | 'list';
    returnViewMode: 'grid' | 'list';
    expenseViewMode: 'grid' | 'list';
    lastCompletedSale: { sale: Sale; customer: Customer | null } | null;
    actions: AppActions;
}

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
    createNewCart: () => void;
    switchToCart: (cartId: string) => void;
    saveActiveCartAsDraft: (name: string) => void;
    deleteCart: (cartId: string) => void;
    finalizeSale: (paymentData: any) => Promise<boolean>;
    clearLastCompletedSale: () => void;
    processReturn: (returnData: any) => Promise<boolean>;
    processStockIntake: (intakeData: any) => Promise<boolean>;
    setProductViewMode: (mode: 'grid' | 'list') => void;
    setStockViewMode: (mode: 'grid' | 'list') => void;
    setCustomerViewMode: (mode: 'grid' | 'list') => void;
    setSupplierViewMode: (mode: 'grid' | 'list') => void;
    setSalesHistoryViewMode: (mode: 'grid' | 'list') => void;
    setReturnViewMode: (mode: 'grid' | 'list') => void;
    setExpenseViewMode: (mode: 'grid' | 'list') => void;
}

const defaultCartId = uuidv4();
const initialCart: Cart = {
    id: defaultCartId,
    name: 'Panier 1',
    items: [],
    customerUuid: null,
    discount: { type: 'fixed', value: 0 },
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            session: null,
            sessionLoading: true,
            user: null,
            profile: null,
            isSettingsLoading: true,
            carts: [initialCart],
            activeCartId: defaultCartId,
            productViewMode: 'grid',
            stockViewMode: 'grid',
            customerViewMode: 'grid',
            supplierViewMode: 'grid',
            salesHistoryViewMode: 'grid',
            returnViewMode: 'grid',
            expenseViewMode: 'grid',
            lastCompletedSale: null,
            actions: {
                setSession: (session) => set({ session, user: session?.user ?? null, sessionLoading: false }),
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
                    set({ session: null, user: null, profile: null });
                },
                fetchProfile: async () => {
                    try {
                        set({ isSettingsLoading: true });
                        const profile = await profileService.getProfile();
                        set({ profile });
                    } catch (error: any) {
                        toast.error("Profil non trouvé.");
                    } finally {
                        set({ isSettingsLoading: false });
                    }
                },
                updateProfile: async (profileData) => {
                    const updated = await profileService.updateProfile(profileData);
                    set({ profile: updated });
                },
                addProductToCart: (product, quantity) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (!cart) return;
                    
                    const existing = cart.items.find(i => i.uuid === product.uuid);
                    const currentInCart = existing ? existing.cartQuantity : 0;
                    
                    // Strict Stock Validation: Must account for items already in cart
                    if (!product.uuid.startsWith('custom-') && (currentInCart + quantity) > product.quantity) {
                        throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.quantity}. Déjà en panier: ${currentInCart}`);
                    }
                    
                    if (existing) {
                        existing.cartQuantity += quantity;
                        existing.flash = true;
                    } else {
                        cart.items.unshift({ ...product, cartQuantity: quantity, flash: true });
                    }
                })),
                updateCartItemQuantity: (uuid, qty) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (!cart) return;
                    const item = cart.items.find(i => i.uuid === uuid);
                    if (item) {
                        if (qty <= 0) {
                            cart.items = cart.items.filter(i => i.uuid !== uuid);
                        } else if (!item.uuid.startsWith('custom-') && qty > item.quantity) {
                            throw new Error(`Stock insuffisant. Maximum disponible: ${item.quantity}`);
                        } else {
                            item.cartQuantity = qty;
                        }
                    }
                })),
                updateCartItemPrice: (uuid, price) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    const item = cart?.items.find(i => i.uuid === uuid);
                    if (item) item.price = price;
                })),
                removeCartItem: (uuid) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (cart) cart.items = cart.items.filter(i => i.uuid !== uuid);
                })),
                clearCartFlashes: () => set(produce((state: AppState) => {
                    state.carts.forEach(c => c.items.forEach(i => { delete i.flash; }));
                })),
                setCartCustomer: (customer) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (cart) cart.customerUuid = customer?.uuid || null;
                })),
                setCartDiscount: (disc) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (cart) cart.discount = disc;
                })),
                clearCart: () => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (cart) { 
                        cart.items = []; 
                        cart.discount = { type: 'fixed', value: 0 }; 
                        cart.customerUuid = null;
                    }
                })),
                createNewCart: () => set(produce((state: AppState) => {
                    const id = uuidv4();
                    state.carts.push({ id, name: `Panier ${state.carts.length + 1}`, items: [], customerUuid: null, discount: { type: 'fixed', value: 0 } });
                    state.activeCartId = id;
                })),
                switchToCart: (id) => set({ activeCartId: id }),
                saveActiveCartAsDraft: (name) => set(produce((state: AppState) => {
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (cart) cart.name = name;
                })),
                deleteCart: (id) => set(produce((state: AppState) => {
                    state.carts = state.carts.filter(c => c.id !== id);
                    if (state.carts.length === 0) {
                        const newId = uuidv4();
                        state.carts.push({ id: newId, name: 'Panier 1', items: [], customerUuid: null, discount: { type: 'fixed', value: 0 } });
                        state.activeCartId = newId;
                    } else if (state.activeCartId === id) {
                        state.activeCartId = state.carts[0].id;
                    }
                })),
                finalizeSale: async (paymentData) => {
                    const state = get();
                    const cart = state.carts.find(c => c.id === state.activeCartId);
                    if (!cart || cart.items.length === 0) return false;
                    try {
                        const sale = await salesService.createSale({ 
                            ...paymentData, 
                            items: cart.items, 
                            discountType: cart.discount.type, 
                            discountValue: cart.discount.value, 
                            customerUuid: cart.customerUuid 
                        });
                        
                        const customer = cart.customerUuid ? await customerService.getCustomerByUuid(cart.customerUuid) : null;
                        set({ lastCompletedSale: { sale, customer: customer || null } });
                        
                        // Deduct stock
                        for (const item of sale.items) {
                            if (item.productUuid) {
                                await inventoryService.adjustStock(item.productUuid, -item.quantity, 'sale', sale.uuid);
                            }
                        }
                        
                        // Update customer totals
                        if (sale.customerUuid) {
                            await customerService.recalculateCustomerStatus(sale.customerUuid);
                        }
                        
                        state.actions.clearCart();
                        toast.success("Vente enregistrée avec succès !");
                        return true;
                    } catch (e: any) {
                        toast.error(e.message || "Erreur lors de la finalisation.");
                        return false;
                    }
                },
                clearLastCompletedSale: () => set({ lastCompletedSale: null }),
                processReturn: async (data) => {
                    try {
                        const ret = await returnService.addReturn(data);
                        for (const i of ret.items) {
                            if (i.wasRestocked && i.productUuid) {
                                await inventoryService.adjustStock(i.productUuid, i.quantity, 'return', ret.uuid);
                            }
                        }
                        if (ret.customerUuid) {
                            await customerService.recalculateCustomerStatus(ret.customerUuid);
                        }
                        toast.success("Retour enregistré avec succès.");
                        return true;
                    } catch (e: any) { 
                        toast.error(e.message); 
                        return false; 
                    }
                },
                processStockIntake: async (data) => {
                    try {
                        const sup = await supplierService.findOrCreateSupplier(data.supplierName, data.supplierUuid);
                        const ratio = data.totalValue > 0 ? data.transportFees / data.totalValue : 0;
                        const finalItems = [];
                        
                        for (const i of data.items) {
                            const cost = i.purchasePrice * (1 + ratio);
                            let uuid = i.productUuid;
                            if (i.isNew) {
                                const p = await productService.addProduct({ ...i, purchasePrice: cost, supplierUuid: sup.uuid, quantity: 0 });
                                uuid = p.uuid;
                            } else {
                                await productService.updateProduct(uuid!, { purchase_price: cost, date_maj_prix: new Date() } as any);
                            }
                            
                            if (uuid) {
                                const qty = i.quantity - i.quantityDamaged;
                                if (qty > 0) await inventoryService.adjustStock(uuid, qty, 'stock_intake');
                                finalItems.push({ 
                                    productUuid: uuid, 
                                    productName: i.name, 
                                    quantityReceived: i.quantity, 
                                    quantityDamaged: i.quantityDamaged, 
                                    purchasePrice: i.purchasePrice, 
                                    costPrice: cost 
                                });
                            }
                        }
                        
                        await stockService.addStockIntake({ 
                            supplierUuid: sup.uuid, 
                            invoiceNumber: data.invoiceNumber, 
                            invoiceDate: data.invoiceDate, 
                            items: finalItems, 
                            totalValue: data.totalValue, 
                            transportFees: data.transportFees 
                        });
                        
                        await supplierService.updateSupplierBalance(sup.uuid, data.totalValue + data.transportFees);
                        toast.success("Stock mis à jour avec succès.");
                        return true;
                    } catch (e: any) { 
                        toast.error(e.message); 
                        return false; 
                    }
                },
                setProductViewMode: (m) => set({ productViewMode: m }),
                setStockViewMode: (m) => set({ stockViewMode: m }),
                setCustomerViewMode: (m) => set({ customerViewMode: m }),
                setSupplierViewMode: (m) => set({ supplierViewMode: m }),
                setSalesHistoryViewMode: (m) => set({ salesHistoryViewMode: m }),
                setReturnViewMode: (m) => set({ returnViewMode: m }),
                setExpenseViewMode: (m) => set({ expenseViewMode: m }),
            }
        }),
        {
            name: 'ipos-v4-strict-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ 
                carts: s.carts, 
                activeCartId: s.activeCartId, 
                productViewMode: s.productViewMode, 
                stockViewMode: s.stockViewMode, 
                customerViewMode: s.customerViewMode, 
                supplierViewMode: s.supplierViewMode, 
                salesHistoryViewMode: s.salesHistoryViewMode, 
                returnViewMode: s.returnViewMode, 
                expenseViewMode: s.expenseViewMode 
            }),
            onRehydrateStorage: () => (s) => { if (s) s.sessionLoading = false; }
        }
    )
);

export const useAppActions = () => useAppStore((s) => s.actions);
export const useIsManagerOrAdmin = () => {
    const role = useAppStore(s => s.profile?.role);
    return role === 'admin' || role === 'manager';
};
