
'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export function useDateRange(defaultDays: number = 29) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setDateRange({
            from: startOfDay(subDays(new Date(), defaultDays)),
            to: endOfDay(new Date()),
        });
        setIsMounted(true);
    }, [defaultDays]);

    return { dateRange, setDateRange, isMounted };
}
