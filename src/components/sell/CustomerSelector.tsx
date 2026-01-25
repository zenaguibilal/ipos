'use client';
import type { Customer, CustomerWithSalesData } from '@/lib/types';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface CustomerSelectorProps {
    customersWithData: CustomerWithSalesData[];
    selectedCustomerId: string | null;
    onSelectCustomer: (customerId: string | null) => void;
    onAddNewCustomer: () => void;
    isLoading: boolean;
}

export function CustomerSelector({ customersWithData, selectedCustomerId, onSelectCustomer, onAddNewCustomer, isLoading }: CustomerSelectorProps) {
    
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
        <div className="flex gap-2">
            <div className="flex-grow">
                 <Combobox
                    options={customerOptions}
                    value={selectedCustomerId || 'walk-in'}
                    onSelect={(value) => onSelectCustomer(value === 'walk-in' ? null : value)}
                    placeholder="Sélectionner un client"
                    searchPlaceholder="Rechercher un client..."
                    notFoundMessage="Aucun client trouvé."
                />
            </div>
             <Button variant="outline" size="icon" onClick={onAddNewCustomer}>
                <PlusCircle className="h-4 w-4"/>
                <span className="sr-only">Ajouter un nouveau client</span>
            </Button>
        </div>
    );
}
