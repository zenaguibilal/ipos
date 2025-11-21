
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { LowStockAlerts } from '@/components/notifications/low-stock-alerts';
import { DebtAlerts } from '@/components/notifications/debt-alerts';
import type { Product, Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { differenceInDays } from 'date-fns';


export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- DATA FETCHING ---
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
  const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- ALERTS CALCULATION ---
  const { lowStockProducts, debtAlertCustomers } = useMemo(() => {
    if (!products || !customers || !sales || !payments) {
      return { lowStockProducts: [], debtAlertCustomers: [] };
    }

    // Low stock alerts
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

    // --- Debt Alerts Logic ---
    const salesByCustomer = sales.reduce((acc, sale) => {
        if (sale.customerId) {
            if (!acc[sale.customerId]) {
                acc[sale.customerId] = { totalSpent: 0, debtFromSales: 0 };
            }
            acc[sale.customerId].totalSpent += sale.total;
            acc[sale.customerId].debtFromSales += sale.remainingBalance;
        }
        return acc;
    }, {} as Record<string, { totalSpent: number, debtFromSales: number }>);

    const paymentsByCustomer = payments.reduce((acc, payment) => {
         if (payment.customerId) {
            if (!acc[payment.customerId]) {
                acc[payment.customerId] = 0;
            }
            acc[payment.customerId] += payment.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    const customersWithDebt = customers.map(customer => {
        const customerSales = salesByCustomer[customer.id] || { totalSpent: 0, debtFromSales: 0 };
        const customerPayments = paymentsByCustomer[customer.id] || 0;
        const outstandingBalance = customerSales.debtFromSales - customerPayments;

        return {
            ...customer,
            totalSpent: customerSales.totalSpent,
            outstandingBalance: outstandingBalance > 0 ? outstandingBalance : 0,
        };
    }).filter(c => c.outstandingBalance > 0);

    const today = new Date();
    const currentDayOfMonth = today.getDate();

    const debtAlertCustomers = customersWithDebt.map(customer => {
        let isReminderDue = false;
        let daysLate: number | undefined = undefined;
        
        if (customer.settlementDay) {
            const settlementDay = customer.settlementDay;
            // Reminder is due one day before settlement day
            const reminderDay = settlementDay === 1 ? 31 : settlementDay - 1; // Simplified for now

            if (currentDayOfMonth === reminderDay) {
                isReminderDue = true;
            } else if (currentDayOfMonth > settlementDay) {
                isReminderDue = true;
                daysLate = currentDayOfMonth - settlementDay;
            } else if (currentDayOfMonth < settlementDay) {
                // Check if we are in the next month but before the settlement day
                const lastMonthSettlementDate = new Date(today.getFullYear(), today.getMonth() -1, settlementDay);
                 if (today > lastMonthSettlementDate) {
                    isReminderDue = true;
                    daysLate = differenceInDays(today, new Date(today.getFullYear(), today.getMonth(), settlementDay));
                 }
            }
        } else {
            // For customers with no settlement day, maybe always show reminder if they have debt?
            // For now, let's stick to the logic for customers with a settlement day.
            // isReminderDue = true; // Or some other business logic
        }

        return { ...customer, isReminderDue, daysLate };
    }).filter(c => c.isReminderDue);


    return { lowStockProducts, debtAlertCustomers };

  }, [products, customers, sales, payments]);

  const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement des alertes...</p>
      </div>
    );
  }

  const totalAlerts = lowStockProducts.length + debtAlertCustomers.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Alertes ({totalAlerts})</h1>
      </div>
      
      {totalAlerts === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
          <p className="text-muted-foreground">Aucune alerte pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-8">
          <LowStockAlerts products={lowStockProducts} />
          <DebtAlerts customers={debtAlertCustomers} />
        </div>
      )}
    </div>
  );
}
