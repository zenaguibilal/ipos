'use client';

import { useLiveQuery } from 'dexie-react-hooks';
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
    
    const data = useLiveQuery(async () => {
        if (!dateRange?.from || !dateRange.to) return initialData;
        try {
            return await dataService.getDashboardData(dateRange.from, dateRange.to);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
            toast.error("Impossible de charger les données du tableau de bord.");
            return initialData;
        }
    }, [dateRange], initialData);

    return { data: data || initialData, isLoading: data === undefined };
}
