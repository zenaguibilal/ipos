'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useDateRange } from '@/hooks/useDateRange';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StockAlertsCard } from '@/components/dashboard/StockAlertsCard';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(6);
    const { data, isLoading } = useDashboardData(dateRange);

    if (!isMounted || isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                    <Skeleton className="h-10 w-72" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
                <div className="grid gap-4 lg:grid-cols-5">
                     <div className="lg:col-span-3">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Tableau de bord"
                description="Aperçu en temps réel de votre activité."
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
            </PageHeader>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KPICard stats={data.stats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueChart sales={data.sales} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <TopProductsCard products={data.topProducts} />
                    <StockAlertsCard products={data.lowStockProducts} />
                </div>
            </div>

             <div className="grid grid-cols-1">
                <RecentActivityCard activities={data.recentActivity} />
            </div>
        </div>
    );
}
