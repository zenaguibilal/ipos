'use client';

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { Customer, Sale, Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useCustomerMetrics } from '@/hooks/useCustomerMetrics';


interface CustomerComboboxProps {
    customerId: number | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

const WalkInCustomerOption: ComboboxOption = {
    value: 'walk-in',
    label: 'Client de passage',
    subLabel: 'Aucun client sélectionné',
};

export function CustomerCombobox({ customerId, onSelectCustomer }: CustomerComboboxProps) {
    
    const customers = useLiveQuery(() => db.customers.orderBy('lastName').toArray());
    const sales = useLiveQuery(() => db.sales.toArray());
    const payments = useLiveQuery(() => db.payments.toArray());

    const customerOptions = useMemo<ComboboxOption[]>(() => {
        if (!customers || !sales || !payments) return [WalkInCustomerOption];

        const salesByCustomer = new Map<number, Sale[]>();
        sales.forEach(sale => {
            if (!sale.customerId) return;
            const existing = salesByCustomer.get(sale.customerId) || [];
            salesByCustomer.set(sale.customerId, [...existing, sale]);
        });

        const paymentsByCustomer = new Map<number, Payment[]>();
        payments.forEach(payment => {
            if (!payment.customerId) return;
            const existing = paymentsByCustomer.get(payment.customerId) || [];
            paymentsByCustomer.set(payment.customerId, [...existing, payment]);
        });
        
        const options = customers.map(c => {
            const customerSales = salesByCustomer.get(c.id!) || [];
            const customerPayments = paymentsByCustomer.get(c.id!) || [];
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            const outstandingBalance = totalSpent - totalPaid;
            
            return {
                value: String(c.id!),
                label: `${c.firstName} ${c.lastName}`,
                subLabel: `Dette: ${formatCurrency(outstandingBalance)}`,
                subLabelClassName: outstandingBalance > 0 ? 'text-destructive' : 'text-green-600',
            };
        });

        return [WalkInCustomerOption, ...options];

    }, [customers, sales, payments]);


    const handleSelect = (value: string) => {
        if (value === 'walk-in') {
            onSelectCustomer(null);
        } else {
            const selectedCustomer = customers?.find(c => c.id === parseInt(value, 10));
            onSelectCustomer(selectedCustomer || null);
        }
    };
    
    return (
        <Combobox
            options={customerOptions}
            onSelect={handleSelect}
            value={customerId ? String(customerId) : 'walk-in'}
            placeholder="Sélectionner un client..."
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
        />
    );
}
