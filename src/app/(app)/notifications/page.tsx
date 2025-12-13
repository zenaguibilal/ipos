
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { LowStockAlerts } from '@/components/notifications/low-stock-alerts';
import { DebtAlerts } from '@/components/notifications/debt-alerts';
import { InactiveCustomersAlerts } from '@/components/notifications/inactive-customers-alerts';
import type { Product, Customer, Sale, Payment, CompanyProfile } from '@/lib/types';
import { differenceInDays, subDays } from 'date-fns';
import { safeToDate } from '@/lib/utils';


export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // --- DATA FETCHING ---
  const productsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const customersCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
  const salesCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
  const paymentsCollectionRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
  const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
  const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);
  const { data: companyProfile, isLoading: isLoadingCompanyProfile } = useDoc<CompanyProfile>(companyDocRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- ALERTS CALCULATION ---
  const { lowStockProducts, debtAlertCustomers, inactiveCustomers } = useMemo(() => {
    if (!products || !customers || !sales || !payments) {
      return { lowStockProducts: [], debtAlertCustomers: [], inactiveCustomers: [] };
    }

    // --- Shared Customer Data Calculation ---
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

    const lastActivityByCustomer = [...sales, ...payments].reduce((acc, transaction) => {
        const customerId = transaction.customerId;
        if (customerId) {
            const transactionDate = safeToDate(transaction.createdAt);
            if (!acc[customerId] || transactionDate > acc[customerId]) {
                acc[customerId] = transactionDate;
            }
        }
        return acc;
    }, {} as Record<string, Date>);

    const customersWithFullData = customers.map(customer => {
        const customerSales = salesByCustomer[customer.id] || { totalSpent: 0, debtFromSales: 0 };
        const customerPayments = paymentsByCustomer[customer.id] || 0;
        const outstandingBalance = customerSales.debtFromSales - customerPayments;

        return {
            ...customer,
            totalSpent: customerSales.totalSpent,
            outstandingBalance: outstandingBalance > 0 ? outstandingBalance : 0,
            lastActivityDate: lastActivityByCustomer[customer.id] || null,
        };
    });

    // --- Low stock alerts ---
    const lowStockProducts = products.filter(p => p.quantity <= p.minStockLevel);

    // --- Debt Alerts Logic ---
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    const customersWithDebt = customersWithFullData.filter(c => c.outstandingBalance > 0);

    const debtAlertCustomers = customersWithDebt.map(customer => {
        let isReminderDue = false;
        let daysLate: number | undefined = undefined;
        
        if (customer.settlementDay) {
            const settlementDay = customer.settlementDay;
            // Check if today is on or past this month's settlement day
            if (currentDayOfMonth >= settlementDay) {
                const settlementDateThisMonth = new Date(today.getFullYear(), today.getMonth(), settlementDay);
                // Only consider it late if they haven't paid since that day
                const lastPayment = lastActivityByCustomer[customer.id];
                if (!lastPayment || lastPayment < settlementDateThisMonth) {
                    isReminderDue = true;
                    daysLate = currentDayOfMonth - settlementDay;
                }
            }
        } else { // If no settlement day, always consider them due for a reminder if they have debt
            isReminderDue = true; 
        }

        return { ...customer, isReminderDue, daysLate };
    }).filter(c => c.isReminderDue);
    
    // --- Inactive Customers Logic ---
    const twentyDaysAgo = subDays(new Date(), 20);
    const inactiveCustomers = customersWithFullData.filter(customer => {
        // Customers with no activity at all are considered inactive
        if (!customer.lastActivityDate) return true;
        // Customers whose last activity was more than 20 days ago
        return customer.lastActivityDate < twentyDaysAgo;
    });


    return { lowStockProducts, debtAlertCustomers, inactiveCustomers };

  }, [products, customers, sales, payments]);

  const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments || isLoadingCompanyProfile;

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement des alertes...</p>
      </div>
    );
  }

  const totalAlerts = lowStockProducts.length + debtAlertCustomers.length + inactiveCustomers.length;

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
          <DebtAlerts customers={debtAlertCustomers} companyProfile={companyProfile} />
          <InactiveCustomersAlerts customers={inactiveCustomers} companyProfile={companyProfile} />
        </div>
      )}
    </div>
  );
}
