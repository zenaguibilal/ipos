
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { VerificationNotice } from '@/components/dashboard/verification-notice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { TopProducts } from '@/components/dashboard/top-products';
import { TopCustomers } from '@/components/dashboard/top-customers';

import type { Sale, Product, Customer, Payment, ChartData, TopProduct, TopCustomer, CustomerWithSalesData } from '@/lib/types';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- Data Fetching ---
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayEnd = useMemo(() => endOfDay(new Date()), []);

  const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);


  // Queries
  const todaySalesQuery = useMemoFirebase(() => {
    if (!salesCollectionRef) return null;
    return query(
        salesCollectionRef, 
        where('createdAt', '>=', Timestamp.fromDate(todayStart)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd))
    );
  }, [salesCollectionRef, todayStart, todayEnd]);

  // Hooks
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: todaySales, isLoading: isLoadingTodaySales } = useCollection<Sale>(todaySalesQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- Memos for derived data ---
  
  const stats = useMemo(() => {
    if (!todaySales || !products || !customers || !sales || !payments) {
      return { dailyRevenue: 0, dailyNetProfit: 0, dailySalesCount: 0, totalDebt: 0, lowStockCount: 0, inventoryValue: 0 };
    }

    // Daily stats
    const dailyRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const dailySalesCount = todaySales.length;

    const dailyNetProfit = todaySales.reduce((profit, sale) => {
        const saleCost = sale.items.reduce((cost, item) => {
            const product = products.find(p => p.id === item.id);
            const itemCost = product ? product.purchasePrice * item.quantity : item.price * item.quantity;
            return cost + itemCost;
        }, 0);
        return profit + (sale.total - saleCost);
    }, 0);

    // Global stats
    const salesByCustomer = sales.reduce((acc, sale) => {
        if (sale.customerId && sale.remainingBalance > 0) {
            if (!acc[sale.customerId]) acc[sale.customerId] = 0;
            acc[sale.customerId] += sale.remainingBalance;
        }
        return acc;
    }, {} as Record<string, number>);

    const paymentsByCustomer = payments.reduce((acc, payment) => {
         if (payment.customerId) {
            if (!acc[payment.customerId]) acc[payment.customerId] = 0;
            acc[payment.customerId] += payment.amount;
        }
        return acc;
    }, {} as Record<string, number>);
    
    const totalDebt = Object.keys(salesByCustomer).reduce((sum, customerId) => {
        const debt = salesByCustomer[customerId] || 0;
        const paid = paymentsByCustomer[customerId] || 0;
        const balance = debt - paid;
        return sum + (balance > 0 ? balance : 0);
    }, 0);

    const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel).length;

    const inventoryValue = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);

    return { dailyRevenue, dailyNetProfit, dailySalesCount, totalDebt, lowStockCount, inventoryValue };
  }, [todaySales, sales, products, customers, payments]);


  const { salesChartData, profitChartData } = useMemo(() => {
    const defaultData = { salesChartData: [], profitChartData: [] };
    if (!sales || !products) return defaultData;
    
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
    
    const salesData: ChartData[] = [];
    const profitData: ChartData[] = [];

    last7Days.forEach(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySales = sales.filter(sale => {
        const saleDate = sale.createdAt.toDate();
        return saleDate >= dayStart && saleDate <= dayEnd;
      });

      const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
      const profit = daySales.reduce((profit, sale) => {
        const saleCost = sale.items.reduce((cost, item) => {
            const product = products.find(p => p.id === item.id);
            const itemCost = product ? product.purchasePrice * item.quantity : item.price * item.quantity;
            return cost + itemCost;
        }, 0);
        return profit + (sale.total - saleCost);
    }, 0);
      
      const formattedDate = format(day, 'd MMM', { locale: fr });
      salesData.push({ date: formattedDate, revenue: revenue });
      profitData.push({ date: formattedDate, revenue: profit, profit: profit });
    });

    return { salesChartData: salesData, profitChartData: profitData };
  }, [sales, products]);

  const lowStockProducts = useMemo(() => {
      if (!products) return [];
      return products
        .filter(p => p.quantity <= p.minStockLevel)
        .sort((a,b) => a.quantity - b.quantity);
  }, [products]);

  const topSellingProducts: TopProduct[] = useMemo(() => {
    if (!sales || !products) return [];

    const productMetrics = sales.flatMap(s => s.items).reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = { totalRevenue: 0, unitsSold: 0, totalProfit: 0 };
        }
        const productInfo = products.find(p => p.id === item.id);
        const purchasePrice = productInfo ? productInfo.purchasePrice : item.price;
        
        acc[item.id].totalRevenue += item.price * item.quantity;
        acc[item.id].unitsSold += item.quantity;
        acc[item.id].totalProfit += (item.price - purchasePrice) * item.quantity;
        return acc;
    }, {} as Record<string, { totalRevenue: number, unitsSold: number, totalProfit: number }>);

    return Object.keys(productMetrics)
        .map(productId => {
            const productInfo = products.find(p => p.id === productId);
            if (!productInfo) return null;
            return { 
                ...productInfo, 
                totalRevenue: productMetrics[productId].totalRevenue,
                unitsSold: productMetrics[productId].unitsSold,
                totalProfit: productMetrics[productId].totalProfit,
            };
        })
        .filter((p): p is TopProduct => p !== null)
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);
  }, [sales, products]);

   const topCustomers: TopCustomer[] = useMemo(() => {
    if (!sales || !customers) return [];

    const customerSpending = sales.reduce((acc, sale) => {
        if (sale.customerId) {
            if (!acc[sale.customerId]) {
                acc[sale.customerId] = 0;
            }
            acc[sale.customerId] += sale.total;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(customerSpending)
        .map(customerId => {
            const customerInfo = customers.find(c => c.id === customerId);
            if (!customerInfo) return null;
            return {
                ...customerInfo,
                totalSpent: customerSpending[customerId]
            };
        })
        .filter((c): c is TopCustomer => c !== null)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
  }, [sales, customers]);

  const isLoading = isUserLoading || isLoadingTodaySales || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <VerificationNotice />
      <StatsCards stats={stats} />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventes des 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <SalesChart data={salesChartData} dataKey="revenue" yAxisLabel="Chiffre d'affaires" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Bénéfice net des 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <SalesChart data={profitChartData} dataKey="profit" yAxisLabel="Bénéfice net" barFill="hsl(var(--secondary))" />
            </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <TopProducts products={topSellingProducts} />
        <TopCustomers customers={topCustomers} />
        <LowStockProducts products={lowStockProducts} />
      </div>
    </div>
  );
}

    