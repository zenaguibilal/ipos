import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a Firestore Timestamp or a JavaScript Date to a JavaScript Date.
 * If the input is already a Date, it returns it directly.
 * If it's a Timestamp, it converts it.
 * This prevents errors from calling .toDate() on a Date object.
 * @param date - The Firestore Timestamp or Date to convert.
 * @returns A JavaScript Date object.
 */
export function safeToDate(date: Timestamp | Date): Date {
    if (date instanceof Timestamp) {
        return date.toDate();
    }
    return date;
}
