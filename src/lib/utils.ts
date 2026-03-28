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
 */
export function formatCurrency(value: number, fallbackCurrency = 'DA') {
  const v = (typeof value !== 'number' || isNaN(value)) ? 0 : value;
  
  // SSR SHIELD: Detect environment reliably
  if (typeof window === 'undefined') {
    return `${v.toLocaleString('fr-FR')} ${fallbackCurrency}`;
  }

  let currency = fallbackCurrency;
  let decimals = 1;

  try {
      const state = useAppStore.getState();
      if (state && state.profile) {
          currency = state.profile.currencySymbol || fallbackCurrency;
          decimals = state.profile.decimalPlaces ?? 1;
      }
  } catch {
      // Silent fallback
  }

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
