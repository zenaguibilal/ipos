
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { isToday, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VerificationNotice } from '@/components/dashboard/verification-notice';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Sale, SaleItem, Product, Customer, Payment, CustomerWithSalesData, ChartData } from '@/lib/types';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- DATA FETCHING ---
  const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
  
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- STATS & CHART CALCULATION ---
  const { stats, chartData } = useMemo(() => {
    const stats = {
      dailyRevenue: 0,
      dailySalesCount: 0,
      dailyNetProfit: 0,
      totalDebt: 0,
      lowStockCount: 0,
      lowStockProducts: []
    };
     const chartData: ChartData[] = [];

    if (!sales || !products || !customers || !payments) return { stats, chartData };
    
    const todaySales = sales.filter(sale => sale.createdAt && isToday(sale.createdAt.toDate()));
    
    // Daily stats
    stats.dailyRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    stats.dailySalesCount = todaySales.length;

    // Daily Net Profit
    stats.dailyNetProfit = todaySales.reduce((totalProfit, sale) => {
      const saleProfit = sale.items.reduce((currentSaleProfit, item) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const itemProfit = (item.price - product.purchasePrice) * item.quantity;
          return currentSaleProfit + itemProfit;
        }
        return currentSaleProfit; // Or handle case where product not found
      }, 0);
      return totalProfit + saleProfit;
    }, 0);


    // Low stock
    stats.lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);
    stats.lowStockCount = stats.lowStockProducts.length;

    // Total Debt Calculation
    const salesByCustomer = sales.reduce((acc, sale) => {
        if (sale.remainingBalance > 0 && sale.customerId) {
            if (!acc[sale.customerId]) {
                acc[sale.customerId] = 0;
            }
            acc[sale.customerId] += sale.remainingBalance;
        }
        return acc;
    }, {} as Record<string, number>);

    const paymentsByCustomer = payments.reduce((acc, payment) => {
         if (payment.customerId) {
            if (!acc[payment.customerId]) {
                acc[payment.customerId] = 0;
            }
            acc[payment.customerId] += payment.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    stats.totalDebt = customers.reduce((total, customer) => {
      const debtFromSales = salesByCustomer[customer.id] || 0;
      const totalPayments = paymentsByCustomer[customer.id] || 0;
      const outstandingBalance = debtFromSales - totalPayments;
      return total + (outstandingBalance > 0 ? outstandingBalance : 0);
    }, 0);

     // Chart Data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    const salesByDay = last7Days.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const revenue = sales
            .filter(sale => format(sale.createdAt.toDate(), 'yyyy-MM-dd') === dayString)
            .reduce((sum, sale) => sum + sale.total, 0);
        return {
            date: format(day, 'd MMM', { locale: fr }),
            revenue: revenue,
        };
    });


    return {
      stats: stats,
      chartData: salesByDay
    };

  }, [sales, products, customers, payments]);


  const isLoading = isUserLoading || isLoadingSales || isLoadingProducts || isLoadingCustomers || isLoadingPayments;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Aperçu</h1>
        </div>
        <VerificationNotice />
        <StatsCards stats={stats} />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Ventes des 7 derniers jours</CardTitle>
                    <CardDescription>
                        Aperçu du chiffre d'affaires quotidien.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <SalesChart data={chartData} />
                </CardContent>
            </Card>
            <LowStockProducts products={stats.lowStockProducts} />
        </div>
    </div>
  );
}
