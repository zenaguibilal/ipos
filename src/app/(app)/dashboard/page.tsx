'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { DashboardData } from '@/lib/types';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SalesOverview from '@/components/dashboard/SalesOverview';

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

    const dashboardData = useLiveQuery<DashboardData | undefined>(
        () => dataService.getDashboardData(dateRange),
        [dateRange]
    );

    const isLoading = dashboardData === undefined;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
                    <p className="text-muted-foreground">Aperçu rapide des performances de votre magasin.</p>
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

            <StatsCards stats={dashboardData?.stats} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueChart sales={dashboardData?.sales} isLoading={isLoading} />
                </div>
                 <div className="lg:col-span-1">
                    <SalesOverview 
                        topProducts={dashboardData?.topProducts || []} 
                        topCustomers={dashboardData?.topCustomers || []} 
                        isLoading={isLoading} 
                    />
                </div>
            </div>
        </div>
    );
}
