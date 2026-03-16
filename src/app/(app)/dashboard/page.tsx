'use client';

import { useDateRange } from '@/hooks/useDateRange';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StockAlertsCard } from '@/components/dashboard/StockAlertsCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { ExpensesPieChart } from '@/components/dashboard/ExpensesPieChart';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, ShoppingCart, Archive, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      {/* KPI Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
       <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
    const { dateRange, setDateRange } = useDateRange(6); // Default to last 7 days
    const { data, isLoading, error } = useDashboardData(dateRange);
    const { theme } = useTheme();

    const backgroundClass = theme === 'light' ? 'bg-light' : 'bg-dark';

    if (error) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center text-center p-6">
                <WifiOff className="h-16 w-16 text-destructive" />
                <h2 className="mt-4 text-2xl font-bold">Erreur de chargement des données</h2>
                <p className="mt-2 text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className={cn("p-4 sm:p-6 lg:p-8 min-h-full", backgroundClass)}>
            {isLoading ? <DashboardSkeleton /> : (
                <div className="space-y-8">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-primary orange-glow">Tableau de Bord</h1>
                            <p className="text-lg text-muted-foreground">Bienvenue sur iPOS, aperçu de votre activité.</p>
                        </div>
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                    </header>
    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <KPICard 
                            title="Revenu Total" 
                            value={data.kpis.revenue.current} 
                            change={data.kpis.revenue.vs}
                            icon={DollarSign}
                            format="currency"
                        />
                        <KPICard 
                            title="Bénéfice Net" 
                            value={data.kpis.profit.current} 
                            change={data.kpis.profit.vs}
                            icon={TrendingUp}
                            format="currency"
                        />
                        <KPICard 
                            title="Ventes" 
                            value={data.kpis.sales.current} 
                            change={data.kpis.sales.vs}
                            icon={ShoppingCart}
                            format="number"
                        />
                         <KPICard 
                            title="Valeur du Stock" 
                            value={data.kpis.inventoryValue.current} 
                            subtitle={`${data.kpis.inventoryValue.productCount} produits en stock`}
                            icon={Archive}
                            format="currency"
                        />
                    </div>
    
                    {/* Main Chart & Side Cards */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                           <RevenueChart data={data.chartData} />
                        </div>
                        <div className="space-y-8">
                            <StockAlertsCard alerts={data.stockAlerts} />
                            <RecentActivityCard activities={data.recentActivity} />
                        </div>
                    </div>
    
                    {/* Bottom Row Cards */}
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                         <div className="lg:col-span-1">
                            <TopProductsCard products={data.topProducts} />
                        </div>
                        <div className="lg:col-span-2">
                            <ExpensesPieChart data={data.expensesData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
