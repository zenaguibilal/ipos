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

        const { totalSaleAmount, totalPaidFromSales } = sales.reduce(
            (acc, s) => {
                acc.totalSaleAmount += s.total;
                acc.totalPaidFromSales += s.amountPaid;
                return acc;
            },
            { totalSaleAmount: 0, totalPaidFromSales: 0 }
        );
        
        const totalStandalonePayments = payments.reduce((acc, p) => acc + p.amount, 0);
        
        const balance = totalSaleAmount - totalPaidFromSales - totalStandalonePayments;
        const finalBalance = balance < 0.01 ? 0 : balance;

        const allTransactions = [
            ...sales.map((s): Transaction => ({ type: 'sale', data: s })),
            ...payments.map((p): Transaction => ({ type: 'payment', data: p }))
        ].sort((a, b) => {
            const timeA = a.data.createdAt ? new Date(a.data.createdAt).getTime() : 0;
            const timeB = b.data.createdAt ? new Date(b.data.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        return {
            totalSpent: totalSaleAmount,
            outstandingBalance: finalBalance,
            combinedTransactions: allTransactions,
        };
    }, [sales, payments]);
}
