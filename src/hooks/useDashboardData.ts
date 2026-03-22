'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import type { DateRange } from 'react-day-picker';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';

export function useDashboardData(dateRange?: DateRange) {
    
    const data = useLiveQuery(async () => {
        if (!dateRange?.from || !dateRange.to) return undefined;
        try {
            return await dataService.getDashboardData(dateRange.from, dateRange.to);
        } catch (err) {
            toast.error("Impossible de charger les données du tableau de bord.");
            return undefined;
        }
    }, [dateRange]);

    return { data, isLoading: data === undefined };
}
