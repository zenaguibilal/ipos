'use client';

import { useMemo } from 'react';
import type { Sale, Payment } from '@/lib/types';

export function useCustomerMetrics(customerId: number, sales?: Sale[], payments?: Payment[]) {
    return useMemo(() => {
        if (!sales || !payments) return { totalSpent: 0, outstandingBalance: 0, lastActivityDate: null };

        const customerSales = sales.filter(s => s.customerId === customerId);
        const customerPayments = payments.filter(p => p.customerId === customerId);

        const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);

        const outstandingBalance = totalSpent - totalPaid;

        const allActivities = [...customerSales, ...customerPayments];
        const lastActivityDate = allActivities.length > 0
            ? allActivities.reduce((latest, act) => act.createdAt! > latest ? act.createdAt! : latest, allActivities[0].createdAt!)
            : null;

        return {
            totalSpent,
            outstandingBalance,
            lastActivityDate
        };
    }, [customerId, sales, payments]);
}
