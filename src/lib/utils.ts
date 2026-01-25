import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";
import type { Customer, Sale, Payment, CustomerWithSalesData } from "@/lib/types";
 
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
 * Calculates financial metrics for all customers.
 * @param customers List of all customers.
 * @param allSales List of all sales.
 * @param allPayments List of all standalone payments.
 * @returns An object containing enriched customer data, total debt, and count of customers with debt.
 */
export function calculateAllCustomersMetrics(
    customers: Customer[],
    allSales: Sale[],
    allPayments: Payment[]
) {
    if (!customers || !allSales || !allPayments) {
        return { customersWithSalesData: [], totalDebt: 0, customersWithDebt: 0 };
    }

    const salesByCustomer = allSales.reduce((acc, sale) => {
        if (sale.customerId) {
            if (!acc[sale.customerId]) acc[sale.customerId] = [];
            acc[sale.customerId].push(sale);
        }
        return acc;
    }, {} as Record<string, Sale[]>);

    const paymentsByCustomer = allPayments.reduce((acc, payment) => {
        if (payment.customerId) {
            if (!acc[payment.customerId]) acc[payment.customerId] = [];
            acc[payment.customerId].push(payment);
        }
        return acc;
    }, {} as Record<string, Payment[]>);
    
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    let runningTotalDebt = 0;
    let runningCustomersWithDebt = 0;

    const data = customers.map(customer => {
        const customerSales = salesByCustomer[customer.id] || [];
        const customerPayments = paymentsByCustomer[customer.id] || [];
        
        const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
        const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
        
        const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
        const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;
        
        if (finalBalance > 0) {
            runningTotalDebt += finalBalance;
            runningCustomersWithDebt++;
        }

        const lastSaleDate = customerSales.length > 0 ? Math.max(...customerSales.map(s => safeToDate(s.createdAt).getTime())) : 0;
        const lastPaymentDate = customerPayments.length > 0 ? Math.max(...customerPayments.map(p => safeToDate(p.createdAt).getTime())) : 0;

        const lastActivityTimestamp = Math.max(lastSaleDate, lastPaymentDate);
        const lastActivityDate = lastActivityTimestamp > 0 ? new Date(lastActivityTimestamp) : null;

        let isReminderDue = false;
        if (finalBalance > 0 && customer.settlementDay) {
            if (currentDayOfMonth > customer.settlementDay) {
                isReminderDue = true;
            }
        }

        return {
            ...customer,
            totalSpent,
            outstandingBalance: finalBalance,
            lastActivityDate,
            isReminderDue,
        } as CustomerWithSalesData;
    });

    return {
        customersWithSalesData: data,
        totalDebt: runningTotalDebt,
        customersWithDebt: runningCustomersWithDebt,
    };
}
