'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';
import type { DashboardData } from '@/lib/types';

export function useDashboardData(dateRange?: DateRange) {
    const [data, setData] = useState<DashboardData | undefined>();

    useEffect(() => {
        if (!dateRange?.from || !dateRange.to) {
            setData(undefined);
            return;
        };

        dataService.getDashboardData(dateRange.from, dateRange.to)
            .then(setData)
            .catch(err => {
                toast.error("Impossible de charger les données du tableau de bord.");
                setData(undefined);
            });
    }, [dateRange]);

    return { data, isLoading: data === undefined };
}
