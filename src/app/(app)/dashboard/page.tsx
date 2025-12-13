
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { collection } from 'firebase/firestore';
import { startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { VerificationNotice } from '@/components/dashboard/verification-notice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { TopProducts } from '@/components/dashboard/top-products';
import { TopCustomers } from '@/components/dashboard/top-customers';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { safeToDate } from '@/lib/utils';

import type { Sale, Product, Customer, Payment, ChartData, TopProduct, TopCustomer } from '@/lib/types';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  });

  // --- Data Fetching ---
  const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

  // Hooks - Fetch all data, then filter locally
  const { data: allSales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: allProducts, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: allCustomers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
  const { data: allPayments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Filtered data based on date range
  const sales = useMemo(() => {
    if (!allSales || !dateRange?.from) return [];
    const from = startOfDay(dateRange.from);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    return allSales.filter(sale => {
      const saleDate = safeToDate(sale.createdAt);
      return saleDate >= from && saleDate <= to;
    });
  }, [allSales, dateRange]);


  // --- Memos for derived data ---
  const stats = useMemo(() => {
    if (!allProducts || !allCustomers || !allSales || !allPayments) {
      return { revenue: 0, netProfit: 0, salesCount: 0, totalDebt: 0, lowStockCount: 0, inventoryValue: 0 };
    }

    // Date-range specific stats
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const salesCount = sales.length;

    const netProfit = sales.reduce((profit, sale) => {
        const saleCost = sale.items.reduce((cost, item) => {
            const product = allProducts.find(p => p.id === item.id);
            // Fallback to item price if product not found (e.g., custom item)
            const purchasePrice = product?.purchasePrice ?? item.price;
            return cost + (purchasePrice * item.quantity);
        }, 0);
        return profit + (sale.total - saleCost);
    }, 0);

    // Global stats (not affected by date range)
    const salesByCustomer = allSales.reduce((acc, sale) => {
        if (sale.customerId && sale.remainingBalance > 0) {
            if (!acc[sale.customerId]) acc[sale.customerId] = 0;
            acc[sale.customerId] += sale.remainingBalance;
        }
        return acc;
    }, {} as Record<string, number>);

    const paymentsByCustomer = allPayments.reduce((acc, payment) => {
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

    const lowStockCount = allProducts.filter(p => p.quantity <= p.minStockLevel).length;
    const inventoryValue = allProducts.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);

    return { revenue, netProfit, salesCount, totalDebt, lowStockCount, inventoryValue };
  }, [sales, allSales, allProducts, allCustomers, allPayments]);


  const { salesChartData, profitChartData } = useMemo(() => {
    if (!sales || !allProducts || !dateRange?.from) return { salesChartData: [], profitChartData: [] };
    
    const from = startOfDay(dateRange.from);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) +1;
    const days = Array.from({ length: diffDays }, (_, i) => {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        return d;
    });
    
    const salesData: ChartData[] = [];
    const profitData: ChartData[] = [];

    days.forEach(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySales = sales.filter(sale => {
        const saleDate = safeToDate(sale.createdAt);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });

      const revenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
      const profit = daySales.reduce((profit, sale) => {
        const saleCost = sale.items.reduce((cost, item) => {
            const product = allProducts.find(p => p.id === item.id);
            const purchasePrice = product?.purchasePrice ?? item.price;
            return cost + purchasePrice * item.quantity;
        }, 0);
        return profit + (sale.total - saleCost);
    }, 0);
      
      const formattedDate = format(day, 'd MMM', { locale: fr });
      salesData.push({ date: formattedDate, revenue: revenue });
      profitData.push({ date: formattedDate, revenue: profit, profit: profit });
    });

    return { salesChartData: salesData, profitChartData: profitData };
  }, [sales, allProducts, dateRange]);

  const lowStockProducts = useMemo(() => {
      if (!allProducts) return [];
      return allProducts
        .filter(p => p.quantity <= p.minStockLevel)
        .sort((a,b) => a.quantity - b.quantity);
  }, [allProducts]);

  const topSellingProducts: TopProduct[] = useMemo(() => {
    if (!sales || !allProducts) return [];

    const productMetrics = sales.flatMap(s => s.items).reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = { totalRevenue: 0, unitsSold: 0, totalProfit: 0 };
        }
        const productInfo = allProducts.find(p => p.id === item.id);
        const purchasePrice = productInfo ? productInfo.purchasePrice : item.price;
        
        acc[item.id].totalRevenue += item.price * item.quantity;
        acc[item.id].unitsSold += item.quantity;
        acc[item.id].totalProfit += (item.price - purchasePrice) * item.quantity;
        return acc;
    }, {} as Record<string, { totalRevenue: number, unitsSold: number, totalProfit: number }>);

    return Object.keys(productMetrics)
        .map(productId => {
            const productInfo = allProducts.find(p => p.id === productId);
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
  }, [sales, allProducts]);

   const topCustomers: TopCustomer[] = useMemo(() => {
    if (!sales || !allCustomers) return [];

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
            const customerInfo = allCustomers.find(c => c.id === customerId);
            if (!customerInfo) return null;
            return {
                ...customerInfo,
                totalSpent: customerSpending[customerId]
            };
        })
        .filter((c): c is TopCustomer => c !== null)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
  }, [sales, allCustomers]);

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
      <VerificationNotice />
      <div className="flex justify-end">
          <DateRangePicker onUpdate={setDateRange} />
      </div>
      <StatsCards 
        revenue={stats.revenue}
        netProfit={stats.netProfit}
        salesCount={stats.salesCount}
        totalDebt={stats.totalDebt}
        lowStockCount={stats.lowStockCount}
        inventoryValue={stats.inventoryValue}
       />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <SalesChart data={salesChartData} dataKey="revenue" yAxisLabel="Chiffre d'affaires" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Bénéfice net</CardTitle>
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
