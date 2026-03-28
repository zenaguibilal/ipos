import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import placeholderImages from '@/lib/placeholder-images.json';
import { useAppStore } from "@/stores/appStore";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hydration-safe date parser.
 */
export function safeToDate(date: Date | string | null | undefined): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Global Currency Formatter (Absolute SSR Guarded)
 * NUCLEAR RECONSTRUCTION: Eliminates all hydration mismatches by strictly checking window context.
 */
export function formatCurrency(value: number, fallbackCurrency = 'DA') {
  const v = (typeof value !== 'number' || isNaN(value)) ? 0 : value;
  
  let currency = fallbackCurrency;
  let decimals = 1;

  // STRICT HYDRATION SHIELD: Only access state if client-side and store is ready
  if (typeof window !== 'undefined') {
    try {
        const state = useAppStore.getState();
        if (state && state.profile) {
            currency = state.profile.currencySymbol || fallbackCurrency;
            decimals = state.profile.decimalPlaces ?? 1;
        }
    } catch {
        // Fallback during initialization
    }
  }

  return `${v.toLocaleString('fr-FR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })} ${currency}`;
}

export function calculateCartTotals(cart: { items: any[], discount: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
    const discountAmount = cart.discount.type === 'percentage'
        ? (subtotal * (cart.discount.value || 0)) / 100
        : (cart.discount.value || 0);
    return { subtotal, discountAmount, total: Math.max(0, subtotal - discountAmount) };
}

/**
 * Unified Zakat Calculation Engine (Deterministic)
 */
export function calculateZakat(data: any) {
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

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

export const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) return placeholders[category];
    return placeholders.default;
};
