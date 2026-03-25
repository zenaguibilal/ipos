'use client';

import React, { useEffect, useState } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

const WalkInCustomerOption: ComboboxOption = {
    value: 'walk-in',
    label: 'Client de passage',
    subLabel: 'Aucun client sélectionné',
};

export const CustomerCombobox = React.forwardRef<HTMLButtonElement>((props, ref) => {
    const { customerId, customers, actions } = useAppStore(state => ({
        customerId: state.cart?.customerId,
        customers: state.customers,
        actions: state.actions
    }));
    
    useEffect(() => {
        actions.fetchCustomers();
    }, [actions]);

    const customerOptions = React.useMemo<ComboboxOption[]>(() => {
        if (!customers) return [WalkInCustomerOption];

        const options = customers.map(c => {
            const availableCredit = (c.creditLimit || 0) - c.outstandingBalance;
            return {
                value: c.id,
                label: `${c.firstName} ${c.lastName}`,
                subLabel: `Dette: ${formatCurrency(c.outstandingBalance)} | Disponible: ${formatCurrency(availableCredit)}`,
                subLabelClassName: c.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600',
            };
        });

        return [WalkInCustomerOption, ...options];
    }, [customers]);

    const handleSelect = (value: string) => {
        if (value === 'walk-in') {
            actions.setCartCustomer(null);
        } else {
            const selectedCustomer = customers?.find(c => c.id === value);
            actions.setCartCustomer(selectedCustomer || null);
        }
    };
    
    return (
        <Combobox
            ref={ref}
            options={customerOptions}
            onSelect={handleSelect}
            value={customerId || 'walk-in'}
            placeholder="Sélectionner un client..."
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
        />
    );
});

CustomerCombobox.displayName = 'CustomerCombobox';
