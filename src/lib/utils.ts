import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
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

/**
 * Safely formats a number to one decimal place.
 * @param value The number to format.
 * @returns A string representation of the number with one decimal place, or '0.0' if the input is invalid.
 */
export function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(1);
}

export function formatCurrency(value: number, currency = 'DA') {
  return `${formatNumber(value)} ${currency}`;
}
