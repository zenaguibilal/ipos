import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product } from "./types";
import placeholderImages from '@/lib/placeholder-images.json';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Hydration-safe date parser.
 * Prevents build-blocking mismatches between server and client.
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

export function formatCurrency(value: number, currency = 'DA') {
  const v = (typeof value !== 'number' || isNaN(value)) ? 0 : value;
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${currency}`;
}

export function calculateCartTotals(cart: { items: any[], discount: { type: string, value: number } }) {
    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
    const discountAmount = cart.discount.type === 'percentage'
        ? (subtotal * (cart.discount.value || 0)) / 100
        : (cart.discount.value || 0);
    return { subtotal, discountAmount, total: Math.max(0, subtotal - discountAmount) };
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

export const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) return placeholders[category];
    return placeholders.default;
};

export function calculateStockStatus(quantity: number, minStockLevel: number): Product['stockStatus'] {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minStockLevel) return 'low_stock';
  return 'in_stock';
}
