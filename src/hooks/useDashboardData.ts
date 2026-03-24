'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';
import type { DashboardData } from '@/lib/types';

export function useDashboardData(dateRange?: DateRange) {
    const [data, setData] = useState<DashboardData | undefined>();

    useEffect(() => {
        dataService.notify();
        setData(undefined);
    }, [dateRange]);

    return { data, isLoading: true };
}
