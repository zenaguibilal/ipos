
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import type { Product, Sale, ChartData, TopProduct, Customer, Payment, TopCustomer, InventoryValueData } from '@/lib/types';
import { VerificationNotice } from '@/components/dashboard/verification-notice';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { safeToDate } from '@/lib/utils';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TotalDebtChart } from '@/components/dashboard/total-debt-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { TopCustomers } from '@/components/dashboard/top-customers';
import { InventoryValueChart } from '@/components/dashboard/inventory-value-chart';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
    });
    
    // --- Data Fetching ---
    // Fetch ALL data once, filtering will be done in memoized calculations
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
    const { data: allSales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: allPayments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // --- Memoization for calculations ---
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : null;

    // First Memo: Calculate stats for the selected date range
    const { 
        revenue, 
        netProfit, 
        salesCount, 
        chartData,
        topProducts,
        topCustomers,
        averageSaleValue,
        averageItemsPerSale,
    } = useMemo(() => {
        if (!allSales || !products || !customers) return { revenue: 0, netProfit: 0, salesCount: 0, chartData: [], topProducts: [], topCustomers: [], averageSaleValue: 0, averageItemsPerSale: 0 };
        
        const filteredSales = allSales.filter(sale => {
            const saleDate = safeToDate(sale.createdAt);
            if (fromDate && saleDate < fromDate) return false;
            if (toDate && saleDate > toDate) return false;
            return true;
        });

        const productsMap = new Map(products.map(p => [p.id, p]));
        const customersMap = new Map(customers.map(c => [c.id, c]));
        
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalItemsSold = 0;
        const salesByDay: { [date: string]: { revenue: number, profit: number } } = {};

        // Initialize days from the date range
        if (fromDate && toDate) {
            let currentDate = new Date(fromDate);
            while (currentDate <= toDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                salesByDay[dateStr] = { revenue: 0, profit: 0 };
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        filteredSales.forEach(sale => {
            totalRevenue += sale.total;
            totalItemsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);

            const dateStr = safeToDate(sale.createdAt).toISOString().split('T')[0];
            if (salesByDay[dateStr]) {
                salesByDay[dateStr].revenue += sale.total;
            }

            let saleProfit = 0;
            sale.items.forEach(item => {
                const product = productsMap.get(item.id);
                if (product) {
                    const itemProfit = (item.price - product.purchasePrice) * item.quantity;
                    saleProfit += itemProfit;
                }
            });
            totalProfit += saleProfit;
            if (salesByDay[dateStr]) {
                salesByDay[dateStr].profit += saleProfit;
            }
        });

        const sortedChartData: ChartData[] = Object.entries(salesByDay)
            .map(([date, data]) => ({ date, revenue: data.revenue, profit: data.profit }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Top Products Calculation
        const productSales = new Map<string, { unitsSold: number, totalRevenue: number, totalProfit: number }>();
        filteredSales.forEach(sale => {
             sale.items.forEach(item => {
                const product = productsMap.get(item.id);
                if (product) {
                    const itemProfit = (item.price - product.purchasePrice) * item.quantity;
                    const currentProductSales = productSales.get(product.id) || { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
                    currentProductSales.unitsSold += item.quantity;
                    currentProductSales.totalRevenue += item.price * item.quantity;
                    currentProductSales.totalProfit += itemProfit;
                    productSales.set(product.id, currentProductSales);
                }
            });
        });

        const sortedTopProducts: TopProduct[] = Array.from(productSales.entries())
            .map(([productId, salesData]) => ({
                ...(productsMap.get(productId) as Product), ...salesData,
            }))
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 5);

        // Top Customers Calculation
        const customerSpending = new Map<string, number>();
        filteredSales.forEach(sale => {
            if (sale.customerId) {
                const currentSpending = customerSpending.get(sale.customerId) || 0;
                customerSpending.set(sale.customerId, currentSpending + sale.total);
            }
        });

        const sortedTopCustomers: TopCustomer[] = Array.from(customerSpending.entries())
            .map(([customerId, totalSpent]) => ({
                ...(customersMap.get(customerId) as Customer),
                totalSpent,
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);
        
        const averageSaleValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
        const averageItemsPerSale = filteredSales.length > 0 ? totalItemsSold / filteredSales.length : 0;

        return { 
            revenue: totalRevenue, 
            netProfit: totalProfit, 
            salesCount: filteredSales.length, 
            chartData: sortedChartData, 
            topProducts: sortedTopProducts, 
            topCustomers: sortedTopCustomers,
            averageSaleValue,
            averageItemsPerSale
        };

    }, [allSales, products, customers, fromDate, toDate]);

    // Second Memo: Calculate total inventory value, low stock products, and inventory distribution
    const { inventoryValue, lowStockProducts, inventoryValueDistribution } = useMemo(() => {
        if (!products) return { inventoryValue: 0, lowStockProducts: [], inventoryValueDistribution: [] };
        
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStockLevel);

        const productValues = products
            .map(p => ({
                name: p.name,
                value: p.quantity * p.purchasePrice,
            }))
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value);

        const top5Products = productValues.slice(0, 5);
        const otherProductsValue = productValues.slice(5).reduce((acc, p) => acc + p.value, 0);

        const inventoryValueDistributionData: InventoryValueData[] = [...top5Products];
        if (otherProductsValue > 0) {
            inventoryValueDistributionData.push({ name: 'Autres', value: otherProductsValue });
        }
        
        return { 
            inventoryValue: totalInventoryValue, 
            lowStockProducts: lowStock,
            inventoryValueDistribution: inventoryValueDistributionData,
        };
    }, [products]);

    // Third Memo: Calculate total outstanding debt and the data for the debt history chart
    const { totalOutstandingDebt, debtHistoryChartData } = useMemo(() => {
        if (!allSales || !allPayments) return { totalOutstandingDebt: 0, debtHistoryChartData: [] };

        const allSaleTransactions = allSales.map(s => ({ date: safeToDate(s.createdAt), amount: s.total - s.amountPaid, type: 'sale' as const }));
        const allPaymentTransactions = allPayments.map(p => ({ date: safeToDate(p.createdAt), amount: -p.amount, type: 'payment' as const }))
        
        const allTransactions = [...allSaleTransactions, ...allPaymentTransactions];

        // 1. Calculate total debt across all time
        const totalDebt = allTransactions.reduce((acc, t) => acc + t.amount, 0);

        // 2. Calculate debt history for the chart
        if (!fromDate || !toDate) return { totalOutstandingDebt: totalDebt > 0 ? totalDebt : 0, debtHistoryChartData: [] };

        // Find initial debt before the start of the date range
        let runningDebt = allTransactions
            .filter(t => t.date < fromDate)
            .reduce((acc, t) => acc + t.amount, 0);

        const dailyChanges = new Map<string, number>();
        allTransactions
            .filter(t => t.date >= fromDate && t.date <= toDate)
            .forEach(t => {
                const dateStr = t.date.toISOString().split('T')[0];
                dailyChanges.set(dateStr, (dailyChanges.get(dateStr) || 0) + t.amount);
            });
        
        const chartData: {date: string, totalDebt: number}[] = [];
        let currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const change = dailyChanges.get(dateStr) || 0;
            runningDebt += change;
            chartData.push({ date: dateStr, totalDebt: runningDebt > 0 ? runningDebt : 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { totalOutstandingDebt: totalDebt > 0 ? totalDebt : 0, debtHistoryChartData: chartData };

    }, [allSales, allPayments, fromDate, toDate]);


    const isLoading = isUserLoading || isLoadingProducts || isLoadingSales || isLoadingCustomers || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement du tableau de bord...</p></div>;
    }
    
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <VerificationNotice />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Tableau de Bord</h1>
                 <DateRangePicker onUpdate={setDateRange} />
            </div>

            <StatsCards 
                revenue={revenue}
                netProfit={netProfit}
                salesCount={salesCount}
                inventoryValue={inventoryValue}
                lowStockCount={lowStockProducts.length}
                totalOutstandingDebt={totalOutstandingDebt}
                averageSaleValue={averageSaleValue}
                averageItemsPerSale={averageItemsPerSale}
            />

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Analyse des revenus et bénéfices</CardTitle>
                         <CardDescription>Performance financière pour la période sélectionnée.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <SalesChart data={chartData} />
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                Aucune donnée de vente pour la période sélectionnée.
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Historique du Total des Dettes</CardTitle>
                        <CardDescription>Évolution du montant total dû par tous les clients au fil du temps.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {debtHistoryChartData.length > 0 ? (
                            <TotalDebtChart data={debtHistoryChartData} />
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                Aucune donnée pour la période sélectionnée.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2">
                <TopProducts products={topProducts} />
                <TopCustomers customers={topCustomers} />
                <InventoryValueChart data={inventoryValueDistribution} />
                <LowStockProducts products={lowStockProducts} />
            </div>
        </div>
    );
}
