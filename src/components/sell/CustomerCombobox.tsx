'use client';

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface CustomerComboboxProps {
    customerId: number | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

const WalkInCustomerOption: ComboboxOption = {
    value: 'walk-in',
    label: 'Client de passage',
    subLabel: 'Aucun client sélectionné',
};

export const CustomerCombobox = React.forwardRef<HTMLButtonElement, CustomerComboboxProps>(({ customerId, onSelectCustomer }, ref) => {
    
    const customers = useLiveQuery(() => db.customers.orderBy('lastName').toArray());

    const customerOptions = useMemo<ComboboxOption[]>(() => {
        if (!customers) return [WalkInCustomerOption];

        const options = customers.map(c => {
            return {
                value: String(c.id!),
                label: `${c.firstName} ${c.lastName}`,
                subLabel: `Dette: ${formatCurrency(c.outstandingBalance)}`,
                subLabelClassName: c.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600',
            };
        });

        return [WalkInCustomerOption, ...options];

    }, [customers]);


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
            ref={ref}
            options={customerOptions}
            onSelect={handleSelect}
            value={customerId ? String(customerId) : 'walk-in'}
            placeholder="Sélectionner un client..."
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
        />
    );
});

CustomerCombobox.displayName = 'CustomerCombobox';
