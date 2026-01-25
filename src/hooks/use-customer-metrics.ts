'use client';

import { useMemo } from 'react';
import type { Sale, Payment } from '@/lib/types';
import { safeToDate } from '@/lib/utils';

export type Transaction = { type: 'sale', data: Sale } | { type: 'payment', data: Payment };

export function useCustomerMetrics(sales: Sale[] | null, payments: Payment[] | null) {
    return useMemo(() => {
        if (!sales || !payments) {
            return { totalSpent: 0, outstandingBalance: 0, combinedTransactions: [] };
        }

        // The fetched data is already filtered for the specific customer.
        const customerSales = sales;
        const customerPayments = payments;

        const totalSaleAmount = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
        const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
        
        const balance = totalSaleAmount - totalPaidFromSales - totalStandalonePayments;
        const finalBalance = balance < 0.01 ? 0 : balance;

        const saleTransactions: Transaction[] = customerSales.map(s => ({ type: 'sale', data: s }));
        const paymentTransactions: Transaction[] = customerPayments.map(p => ({ type: 'payment', data: p }));

        const allTransactions = [...saleTransactions, ...paymentTransactions].sort((a, b) => {
            const timeB = b.data.createdAt ? safeToDate(b.data.createdAt).getTime() : 0;
            const timeA = a.data.createdAt ? safeToDate(a.data.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        return {
            totalSpent: totalSaleAmount,
            outstandingBalance: finalBalance,
            combinedTransactions: allTransactions,
        };
    }, [sales, payments]);
}
