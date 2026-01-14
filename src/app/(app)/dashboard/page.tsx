
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import type { Product, Sale, ChartData, TopProduct, Customer, Payment } from '@/lib/types';
import { VerificationNotice } from '@/components/dashboard/verification-notice';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { safeToDate } from '@/lib/utils';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { SalesAndDebtsChart } from '@/components/dashboard/sales-and-debts-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
    });
    
    // --- Data Fetching ---
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // --- Data Processing & Memoization ---
    const { 
        revenue, 
        netProfit, 
        salesCount, 
        chartData, 
        topProducts, 
    } = useMemo(() => {
        if (!sales || !products) return { revenue: 0, netProfit: 0, salesCount: 0, chartData: [], topProducts: [] };

        const filteredSales = sales.filter(sale => {
            const saleDate = safeToDate(sale.createdAt);
            const from = dateRange?.from ? startOfDay(dateRange.from) : null;
            const to = dateRange?.to ? endOfDay(dateRange.to) : null;
            if (from && saleDate < from) return false;
            if (to && saleDate > to) return false;
            return true;
        });

        const productsMap = new Map(products.map(p => [p.id, p]));
        
        let totalRevenue = 0;
        let totalProfit = 0;
        const salesByDay: { [date: string]: { revenue: number, profit: number, newDebt: number } } = {};
        const productSales = new Map<string, { unitsSold: number, totalRevenue: number, totalProfit: number }>();

        filteredSales.forEach(sale => {
            totalRevenue += sale.total;

            const dateStr = safeToDate(sale.createdAt).toISOString().split('T')[0];
            if (!salesByDay[dateStr]) {
                salesByDay[dateStr] = { revenue: 0, profit: 0, newDebt: 0 };
            }
            salesByDay[dateStr].revenue += sale.total;
            salesByDay[dateStr].newDebt += sale.remainingBalance;

            let saleProfit = 0;
            sale.items.forEach(item => {
                const product = productsMap.get(item.id);
                if (product) {
                    const itemProfit = (item.price - product.purchasePrice) * item.quantity;
                    saleProfit += itemProfit;

                    const currentProductSales = productSales.get(product.id) || { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
                    currentProductSales.unitsSold += item.quantity;
                    currentProductSales.totalRevenue += item.price * item.quantity;
                    currentProductSales.totalProfit += itemProfit;
                    productSales.set(product.id, currentProductSales);
                }
            });
            totalProfit += saleProfit;
            salesByDay[dateStr].profit += saleProfit;
        });
        
        const sortedChartData: ChartData[] = Object.entries(salesByDay)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, data]) => ({ date, revenue: data.revenue, profit: data.profit, newDebt: data.newDebt }));
        
        const sortedTopProducts: TopProduct[] = Array.from(productSales.entries())
            .map(([productId, salesData]) => ({
                ...(productsMap.get(productId) as Product),
                ...salesData,
            }))
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, 5);

        return { 
            revenue: totalRevenue, 
            netProfit: totalProfit,
            salesCount: filteredSales.length, 
            chartData: sortedChartData,
            topProducts: sortedTopProducts,
        };
    }, [sales, products, dateRange]);
    
    const { inventoryValue, lowStockProducts, totalOutstandingDebt } = useMemo(() => {
        let totalInventoryValue = 0;
        let lowStock: Product[] = [];
        if (products) {
            totalInventoryValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
            lowStock = products.filter(p => p.quantity <= p.minStockLevel);
        }

        let totalDebt = 0;
        if (customers && sales && payments) {
             totalDebt = customers.reduce((totalAcc, customer) => {
                const customerSales = sales.filter(s => s.customerId === customer.id);
                const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
                const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
                const totalStandalonePayments = payments.filter(p => p.customerId === customer.id).reduce((acc, p) => acc + p.amount, 0);
                const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
                return totalAcc + (outstandingBalance > 0 ? outstandingBalance : 0);
            }, 0);
        }

        return { 
            inventoryValue: totalInventoryValue, 
            lowStockProducts: lowStock,
            totalOutstandingDebt: totalDebt
        };
    }, [products, customers, sales, payments]);


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
            />

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Analyse des revenus et bénéfices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <SalesChart 
                                data={chartData} 
                            />
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                Aucune donnée de vente pour la période sélectionnée.
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Mouvement des ventes et des dettes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <SalesAndDebtsChart 
                                data={chartData} 
                            />
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
                <LowStockProducts products={lowStockProducts} />
            </div>
        </div>
    );
}
