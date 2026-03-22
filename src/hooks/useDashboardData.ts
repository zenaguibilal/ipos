'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { dataService } from '@/services/data-service';
import type { DashboardData } from '@/lib/types';
import { toast } from 'sonner';

const initialData: DashboardData = {
    stats: {
        totalRevenue: 0,
        totalProfit: 0,
        salesCount: 0,
        inventoryValue: 0,
        totalExpenses: 0,
    },
    sales: [],
    expenses: [],
    topProducts: [],
    topCustomers: [],
    lowStockProducts: [],
    recentActivity: [],
};

export function useDashboardData(dateRange?: DateRange) {
    const [data, setData] = useState<DashboardData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!dateRange?.from || !dateRange.to) return;
        
        setIsLoading(true);
        dataService.getDashboardData(dateRange.from, dateRange.to)
            .then(setData)
            .catch(err => {
                console.error("Failed to load dashboard data:", err);
                toast.error("Impossible de charger les données du tableau de bord.");
            })
            .finally(() => setIsLoading(false));

    }, [dateRange]);

    return { data, isLoading };
}
