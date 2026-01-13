
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { LowStockAlerts } from '@/components/notifications/low-stock-alerts';
import { OverduePaymentsAlerts } from '@/components/notifications/overdue-payments-alerts';
import type { Product, Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { getDate } from 'date-fns';


export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- DATA FETCHING ---
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'customers'), orderBy('lastName', 'asc')) : null, [user, firestore]);
  const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
  
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- ALERTS CALCULATION ---
  const { lowStockProducts, overdueCustomers } = useMemo(() => {
    if (!products || !customers || !sales || !payments) {
      return { lowStockProducts: [], overdueCustomers: [] };
    }

    // --- Low stock alerts ---
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

    // --- Overdue payment alerts ---
    const today = new Date();
    const currentDayOfMonth = getDate(today);

    const customersWithData = customers.map(customer => {
        const customerSales = sales.filter(s => s.customerId === customer.id);
        const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
        const totalStandalonePayments = payments.filter(p => p.customerId === customer.id).reduce((acc, p) => acc + p.amount, 0);
        const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;

        let isReminderDue = false;
        let daysLate = 0;
        if (customer.settlementDay && outstandingBalance > 0.01) {
            if (currentDayOfMonth > customer.settlementDay) {
                isReminderDue = true;
                daysLate = currentDayOfMonth - customer.settlementDay;
            }
        }

        return {
            ...customer,
            totalSpent,
            outstandingBalance: outstandingBalance < 0.01 ? 0 : outstandingBalance,
            isReminderDue,
            daysLate,
        };
    });

    const overdueCustomers = customersWithData.filter(c => c.isReminderDue).sort((a, b) => (b.daysLate || 0) - (a.daysLate || 0));


    return { lowStockProducts, overdueCustomers };

  }, [products, customers, sales, payments]);

  const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement des alertes...</p>
      </div>
    );
  }

  const totalAlerts = lowStockProducts.length + overdueCustomers.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      
      {totalAlerts === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
          <p className="text-muted-foreground">Aucune alerte pour le moment. Tout est en ordre !</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-8">
          <LowStockAlerts products={lowStockProducts} />
          <OverduePaymentsAlerts customers={overdueCustomers} />
        </div>
      )}
    </div>
  );
}

    