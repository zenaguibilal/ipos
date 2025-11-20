
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LowStockProducts } from '@/components/dashboard/low-stock-products';
import { isToday } from 'date-fns';
import { VerificationNotice } from '@/components/dashboard/verification-notice';

// Re-using interfaces from other pages for consistency
export interface Sale {
    id: string;
    total: number;
    remainingBalance: number;
    createdAt: Timestamp; 
}
export interface Product {
    id: string;
    name: string;
    quantity: number;
    minStockLevel: number;
}
export interface Customer {
    id: string;
}
export interface Payment {
    id: string;
    customerId: string;
    amount: number;
}
export interface CustomerWithSalesData extends Customer {
    totalSpent: number;
    outstandingBalance: number;
}


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

  // --- STATS CALCULATION ---
  const dashboardStats = useMemo(() => {
    if (!sales || !products || !customers || !payments) return {
      dailyRevenue: 0,
      dailySalesCount: 0,
      totalDebt: 0,
      lowStockCount: 0,
      lowStockProducts: []
    };

    // Daily stats
    const todaySales = sales.filter(sale => isToday(sale.createdAt.toDate()));
    const dailyRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const dailySalesCount = todaySales.length;

    // Low stock
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);
    const lowStockCount = lowStockProducts.length;

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

    const totalDebt = customers.reduce((total, customer) => {
      const debtFromSales = salesByCustomer[customer.id] || 0;
      const totalPayments = paymentsByCustomer[customer.id] || 0;
      const outstandingBalance = debtFromSales - totalPayments;
      return total + (outstandingBalance > 0 ? outstandingBalance : 0);
    }, 0);


    return {
      dailyRevenue,
      dailySalesCount,
      totalDebt,
      lowStockCount,
      lowStockProducts
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
          <h1 className="text-lg font-semibold md:text-2xl">Aperçu de la journée</h1>
        </div>
        <VerificationNotice />
        <StatsCards stats={dashboardStats} />
        <div className="grid gap-4 md:gap-8">
            <LowStockProducts products={dashboardStats.lowStockProducts} />
        </div>
    </div>
  );
}
