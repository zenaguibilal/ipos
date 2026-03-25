'use client';

import React, { useEffect, useState } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { customerService } from '@/services';
import { toast } from 'sonner';

const WalkInCustomerOption: ComboboxOption = {
    value: 'walk-in',
    label: 'Client de passage',
    subLabel: 'Aucun client sélectionné',
};

export const CustomerCombobox = React.forwardRef<HTMLButtonElement>((props, ref) => {
    const { customerUuid } = useAppStore(state => ({
        customerUuid: state.cart.customerUuid,
    }));
    const { setCartCustomer } = useAppActions();
    const [customers, setCustomers] = useState<Customer[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await customerService.getCustomers();
                setCustomers(data);
            } catch (e) {
                toast.error("Impossible de charger la liste des clients.");
            }
        };
        fetch();
    }, []);

    const customerOptions = React.useMemo<ComboboxOption[]>(() => {
        const options = customers.map(c => {
            const availableCredit = (c.creditLimit || 0) - c.outstandingBalance;
            return {
                value: c.uuid,
                label: `${c.firstName} ${c.lastName}`,
                subLabel: `Dette: ${formatCurrency(c.outstandingBalance)} | Disponible: ${formatCurrency(availableCredit)}`,
                subLabelClassName: c.outstandingBalance > 0 ? 'text-destructive' : 'text-chart-quaternary',
            };
        });

        return [WalkInCustomerOption, ...options];
    }, [customers]);

    const handleSelect = (value: string) => {
        if (value === 'walk-in') {
            setCartCustomer(null);
        } else {
            const selectedCustomer = customers?.find(c => c.uuid === value);
            setCartCustomer(selectedCustomer || null);
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
