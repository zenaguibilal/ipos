'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDateRange } from '@/hooks/useDateRange';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { StockAlertsCard } from '@/components/dashboard/StockAlertsCard';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { TopCustomersCard } from '@/components/dashboard/TopCustomersCard';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import type { DashboardStats, TopProduct, TopCustomer, Product, Sale, Expense, GlobalActivityItem } from '@/lib/types';

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(6);

    const sales = useLiveQuery(
        () => (dateRange?.from && dateRange?.to ? db.sales.where('createdAt').between(dateRange.from, dateRange.to, true, true).toArray() : []),
        [dateRange]
    );

    const expenses = useLiveQuery(
        () => (dateRange?.from && dateRange?.to ? db.expenses.where('expenseDate').between(dateRange.from, dateRange.to, true, true).toArray() : []),
        [dateRange]
    );

    const products = useLiveQuery(() => db.products.toArray(), []);
    const customers = useLiveQuery(() => db.customers.toArray(), []);
    const recentActivity = useLiveQuery(() => dataService.getGlobalActivity(10), []);

    const data = useMemo(() => {
        if (!sales || !expenses || !products || !customers || !recentActivity) return null;

        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalProfit = sales.flatMap(s => s.items).reduce((sum, i) => sum + (i.price - i.purchasePrice) * i.quantity, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const stats: DashboardStats = {
            totalRevenue,
            totalProfit: totalProfit,
            salesCount: sales.length,
            inventoryValue: products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
            totalExpenses: totalExpenses,
        };

        const productSales: { [id: number]: { totalRevenue: number, unitsSold: number, totalProfit: number } } = {};
        sales.flatMap(s => s.items).forEach(item => {
            if (typeof item.id === 'number') {
                if (!productSales[item.id]) productSales[item.id] = { totalRevenue: 0, unitsSold: 0, totalProfit: 0 };
                productSales[item.id].totalRevenue += item.price * item.quantity;
                productSales[item.id].unitsSold += item.quantity;
                productSales[item.id].totalProfit += (item.price - item.purchasePrice) * item.quantity;
            }
        });
        
        const topProductsData: TopProduct[] = Object.entries(productSales)
            .map(([id, data]) => ({ id: Number(id), name: products.find(p=>p.id === Number(id))?.name || 'N/A', ...data }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
        
        const customerSales: { [id: number]: number } = {};
        sales.forEach(s => {
            if (s.customerId) {
                if (!customerSales[s.customerId]) customerSales[s.customerId] = 0;
                customerSales[s.customerId] += s.total;
            }
        });
        const topCustomersData: TopCustomer[] = Object.entries(customerSales)
             .map(([id, total]) => ({ id: Number(id), name: customers.find(c=>c.id===Number(id))?.searchName || 'N/A', totalSpent: total }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

        const lowStockProductsData: Product[] = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).slice(0, 10);
        
        return { 
            stats, 
            sales, 
            topProducts: topProductsData, 
            topCustomers: topCustomersData, 
            lowStockProducts: lowStockProductsData, 
            recentActivity 
        };

    }, [sales, expenses, products, customers, recentActivity]);
    
    const isLoading = !isMounted || !data;

    if (isLoading) {
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[450px] w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         <Skeleton className="h-[250px] w-full" />
                         <Skeleton className="h-[250px] w-full" />
                         <Skeleton className="h-[250px] w-full" />
                    </div>
                </div>
                 <div className="grid grid-cols-1">
                    <Skeleton className="h-[350px] w-full" />
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
                    <TopCustomersCard customers={data.topCustomers} />
                    <StockAlertsCard products={data.lowStockProducts} />
                </div>
            </div>

             <div className="grid grid-cols-1">
                <RecentActivityCard activities={data.recentActivity} />
            </div>
        </div>
    );
}
