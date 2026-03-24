
'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { DashboardData } from '@/lib/types';

export function useDashboardData(dateRange?: DateRange) {
    const [data, setData] = useState<DashboardData | undefined>();

    useEffect(() => {
        // Data fetching is disabled. The dashboard will remain in a loading state.
        setData(undefined);
    }, [dateRange]);

    return { data, isLoading: true };
}
