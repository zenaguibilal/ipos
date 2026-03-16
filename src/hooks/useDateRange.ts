
'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export function useDateRange(defaultDays: number = 6) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const today = new Date();
        setDateRange({
            from: startOfDay(subDays(today, defaultDays)),
            to: endOfDay(today),
        });
        setIsMounted(true);
    }, [defaultDays]);

    const setRange = (newRange?: DateRange) => {
        if (newRange?.from && newRange.to) {
            newRange.from = startOfDay(newRange.from);
            newRange.to = endOfDay(newRange.to);
        }
        setDateRange(newRange);
    }

    return { dateRange, setDate: setRange, isMounted };
}
