
'use client';

import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { DashboardData } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';

export function useDashboardData(dateRange?: DateRange) {
    const data = useLiveQuery(
        () => {
            if (!dateRange?.from || !dateRange?.to) return;
            return dataService.getDashboardData(dateRange.from, dateRange.to);
        },
        [dateRange]
    );

    return { data, isLoading: !data };
}
