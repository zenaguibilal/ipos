
'use client';

import { Button } from '@/components/ui/button';

export type FilterType = 'all' | 'stock' | 'payment';

interface NotificationFiltersProps {
    currentFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export function NotificationFilters({ currentFilter, onFilterChange }: NotificationFiltersProps) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
            <Button
                variant={currentFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange('all')}
            >
                Tout
            </Button>
            <Button
                variant={currentFilter === 'stock' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange('stock')}
            >
                Stock
            </Button>
            <Button
                variant={currentFilter === 'payment' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onFilterChange('payment')}
            >
                Paiements
            </Button>
        </div>
    );
}
