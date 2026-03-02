'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import SalesOverview from '@/components/dashboard/SalesOverview';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

    const dashboardData = useLiveQuery(
        () => {
            if (!dateRange?.from) return undefined;
            return dataService.getDashboardData({ from: dateRange.from, to: dateRange.to || dateRange.from });
        },
        [dateRange],
        undefined
    );

    const isLoading = dashboardData === undefined;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                    <p className="text-muted-foreground">Aperçu des performances de votre activité.</p>
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </header>

            <StatsCards stats={dashboardData?.stats} isLoading={isLoading} />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueChart sales={dashboardData?.sales} isLoading={isLoading} />
                </div>
                <div>
                    <SalesOverview 
                        topProducts={dashboardData?.topProducts ?? []} 
                        topCustomers={dashboardData?.topCustomers ?? []}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
