
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import placeholderImages from '@/lib/placeholder-images.json';
 
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
 * Global Currency Formatter (Hydration-Safe)
 * No longer depends on useAppStore to avoid circular dependencies and SSR issues.
 */
export function formatCurrency(value: number, currency = 'DA', decimals = 1) {
  const v = (typeof value !== 'number' || isNaN(value)) ? 0 : value;
  
  return `${v.toLocaleString('fr-FR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })} ${currency}`;
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

export const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) return placeholders[category];
    return placeholders.default;
};
