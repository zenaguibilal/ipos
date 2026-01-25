'use client';
import type { Customer, CustomerWithSalesData } from '@/lib/types';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

interface CustomerSelectorProps {
    customersWithData: CustomerWithSalesData[];
    selectedCustomerId: string | null;
    onSelectCustomer: (customerId: string | null) => void;
    isLoading: boolean;
}

export function CustomerSelector({ customersWithData, selectedCustomerId, onSelectCustomer, isLoading }: CustomerSelectorProps) {
    
    const customerOptions = useMemo<ComboboxOption[]>(() => {
        const options = (customersWithData || []).map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: c.outstandingBalance > 0 ? `Dette: ${c.outstandingBalance.toFixed(1)} DA` : c.phone || 'Aucun contact',
            subLabelClassName: c.outstandingBalance > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'
        }));
        return [{ value: 'walk-in', label: 'Vente au comptoir', subLabel: 'Client par défaut' }, ...options];
    }, [customersWithData]);

    if(isLoading && !customersWithData?.length) {
        return <Skeleton className="h-10 w-full" />;
    }

    return (
        <Combobox
            options={customerOptions}
            value={selectedCustomerId || 'walk-in'}
            onSelect={(value) => onSelectCustomer(value === 'walk-in' ? null : value)}
            placeholder="Sélectionner un client"
            searchPlaceholder="Rechercher un client..."
            notFoundMessage="Aucun client trouvé."
        />
    );
}
