import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Cart, Draft, Product } from "./types";
import placeholderImages from '@/lib/placeholder-images.json';
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Date object or an ISO string to a JavaScript Date.
 * @param date - The Date or string to convert.
 * @returns A JavaScript Date object.
 */
export function safeToDate(date: Date | string): Date {
    if (date instanceof Date) {
        return date;
    }
    return new Date(date);
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatCurrency(value: number, currency = 'DA') {
  const formattedValue = (typeof value !== 'number' || isNaN(value)) ? '0.0' : value.toFixed(1);
  return `${formattedValue} ${currency}`;
}

type CalculableCart = Pick<Cart, 'items' | 'discount'> | Pick<Draft, 'items' | 'discount'>;

export function calculateCartTotals(cart: CalculableCart) {
    const subtotal = cart.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
    
    const discountAmount = cart.discount.type === 'percentage'
        ? (subtotal * (cart.discount.value || 0)) / 100
        : (cart.discount.value || 0);
    
    const total = Math.max(0, subtotal - discountAmount);

    return { subtotal, discountAmount, total };
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

export const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) {
        return placeholders[category];
    }
    return placeholders.default;
};
