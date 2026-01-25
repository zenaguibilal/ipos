import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";
import type { Customer, Sale, Payment } from "@/lib/types";
 
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


/**
 * Calculates financial metrics for a single customer based on all sales and payments.
 * @param customer The customer to calculate metrics for.
 * @param allSales A list of all sale transactions.
 * @param allPayments A list of all standalone payment transactions.
 * @returns An object containing the customer's total spending and outstanding balance.
 */
export function calculateCustomerMetrics(
    customer: Customer,
    allSales: Sale[],
    allPayments: Payment[]
): { totalSpent: number; outstandingBalance: number } {
    const customerSales = allSales.filter(s => s.customerId === customer.id);
    const customerPayments = allPayments.filter(p => p.customerId === customer.id);
    
    const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
    const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
    const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
    const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;

    return {
        totalSpent,
        outstandingBalance: finalBalance,
    };
}
