import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Cart, Draft } from "./types";
 
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
