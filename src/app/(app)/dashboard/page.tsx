'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import GlobalActivity from '@/components/dashboard/GlobalActivity';
import TopProducts from '@/components/dashboard/TopProducts';
import TopCustomers from '@/components/dashboard/TopCustomers';
import ExpenseSummary from '@/components/dashboard/ExpenseSummary';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Notification } from '@/lib/types';


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

    const unreadAlerts = useLiveQuery<Notification[]>(
        () => dataService.getUnreadLowStockAlerts(),
        [],
        []
    );

    const globalActivity = useLiveQuery(
        () => dataService.getGlobalActivity(10),
        [],
        []
    );

    const isLoading = dashboardData === undefined || unreadAlerts === undefined || globalActivity === undefined;
    
    const handleDismissAlert = async (id: number) => {
        try {
            await dataService.markNotificationAsRead(id);
            toast.success("Alerte marquée comme lue.");
        } catch (e) {
            console.error("Failed to dismiss alert", e);
            toast.error("Impossible de marquer l'alerte comme lue.");
        }
    };

    const statsForCards = dashboardData?.stats;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                    <p className="text-muted-foreground">Aperçu des performances de votre activité.</p>
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </header>
            
            {unreadAlerts && unreadAlerts.length > 0 && (
                <div className="space-y-3">
                    {unreadAlerts.map(alert => (
                         <div key={alert.id!} className="relative luxury-glass-destructive">
                            <Alert variant="destructive" className="border-0 bg-transparent shadow-none">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Alerte de Stock Faible</AlertTitle>
                                <AlertDescription>{alert.message}</AlertDescription>
                            </Alert>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDismissAlert(alert.id!)}
                                aria-label="Masquer l'alerte"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <StatsCards stats={statsForCards} isLoading={isLoading} />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueChart sales={dashboardData?.sales} isLoading={isLoading} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <GlobalActivity 
                        activity={globalActivity ?? []} 
                        isLoading={isLoading}
                    />
                     <TopProducts
                        products={dashboardData?.topProducts ?? []}
                        isLoading={isLoading}
                    />
                    <TopCustomers
                        customers={dashboardData?.topCustomers ?? []}
                        isLoading={isLoading}
                    />
                    <ExpenseSummary
                        expenses={dashboardData?.expenses}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
