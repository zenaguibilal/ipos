/**
 * @fileOverview THE CALCULATION SINGULARITY
 * المركز السيادي للعمليات الحسابية والمنطق المالي لكسر التبعيات الدائرية وضمان الحتمية.
 */

import type { Cart } from './types';

/**
 * حساب إجماليات السلة بشكل حتمي.
 */
export function calculateCartTotals(cart: Pick<Cart, 'items' | 'discount'>) {
    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
    const discountAmount = cart.discount.type === 'percentage'
        ? (subtotal * (cart.discount.value || 0)) / 100
        : (cart.discount.value || 0);
    return { 
        subtotal, 
        discountAmount, 
        total: Math.max(0, subtotal - discountAmount) 
    };
}

/**
 * محرك حساب الزكاة الموحد (Sovereign Engine)
 */
export function calculateZakat(data: {
    goldPrice: number;
    inventoryValue: number;
    customerDebts: number;
    cashOnHand: number;
    supplierDebts: number;
    otherDebts: number;
}) {
    const nisab = (data.goldPrice || 0) * 85;
    const totalAssets = (data.inventoryValue || 0) + Math.max(0, (data.customerDebts || 0)) + (data.cashOnHand || 0);
    const totalLiabilities = (data.supplierDebts || 0) + (data.otherDebts || 0);
    
    const zakatBase = Math.max(0, totalAssets - totalLiabilities);
    const isNisabReached = nisab > 0 && zakatBase >= nisab;
    
    return { 
        ...data, 
        nisab, 
        zakatBase, 
        zakatAmount: isNisabReached ? zakatBase * 0.025 : 0, 
        isNisabReached 
    };
}
