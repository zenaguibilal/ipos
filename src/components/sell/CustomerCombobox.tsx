'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { customerService } from '@/services';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface CustomerComboboxProps {
    customerUuid: string | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

const WalkInCustomerOption: ComboboxOption = {
    value: 'walk-in',
    label: 'Client de passage',
    subLabel: 'Aucun client sélectionné',
};

export const CustomerCombobox = React.forwardRef<HTMLButtonElement, CustomerComboboxProps>(({ customerUuid, onSelectCustomer }, ref) => {
    
    const customers = useLiveQuery(() => customerService.getCustomers({}));

    const customerOptions = React.useMemo<ComboboxOption[]>(() => {
        if (!customers) return [WalkInCustomerOption];

        const options = customers.map(c => {
            const availableCredit = (c.creditLimit || 0) - c.outstandingBalance;
            return {
                value: c.uuid!,
                label: `${c.firstName} ${c.lastName}`,
                subLabel: `Dette: ${formatCurrency(c.outstandingBalance)} | Disponible: ${formatCurrency(availableCredit)}`,
                subLabelClassName: c.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600',
            };
        });

        return [WalkInCustomerOption, ...options];
    }, [customers]);

    const handleSelect = (value: string) => {
        if (value === 'walk-in') {
            onSelectCustomer(null);
        } else {
            const selectedCustomer = customers?.find(c => c.uuid === value);
            onSelectCustomer(selectedCustomer || null);
        }
    };
    
    return (
        <Combobox
            ref={ref}
            options={customerOptions}
            onSelect={handleSelect}
            value={customerUuid || 'walk-in'}
            placeholder="Sélectionner un client..."
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
        />
    );
});

CustomerCombobox.displayName = 'CustomerCombobox';
