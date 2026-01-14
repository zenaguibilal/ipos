
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import type { Product, Customer, Sale, Payment, NotificationItem } from '@/lib/types';
import { getDate } from 'date-fns';
import { NotificationCard } from '@/components/notifications/notification-card';
import { NotificationFilters, type FilterType } from '@/components/notifications/notification-filters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Archive, Users } from 'lucide-react';

export default function NotificationsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [filter, setFilter] = useState<FilterType>('all');

    // --- Data Fetching ---
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { notifications, lowStockCount, latePaymentsCount } = useMemo(() => {
        if (!products || !customers || !sales || !payments) {
            return { notifications: [], lowStockCount: 0, latePaymentsCount: 0 };
        }

        const today = new Date();
        const currentDayOfMonth = getDate(today);

        // 1. Low Stock Notifications
        const lowStockNotifications: NotificationItem[] = products
            .filter(p => p.quantity <= p.minStockLevel)
            .map(p => ({
                id: `stock-${p.id}`,
                type: 'stock',
                message: `Stock faible pour ${p.name}. Restant : ${p.quantity}`,
                relatedId: p.id,
                date: new Date(), 
                isRead: false
            }));

        // 2. Late Payment Notifications
        let totalDebt = 0;
        const customerData = customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            
            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = payments.filter(p => p.customerId === customer.id).reduce((acc, p) => acc + p.amount, 0);
            
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;

            let isReminderDue = false;
            if (customer.settlementDay && finalBalance > 0) {
                if (currentDayOfMonth > customer.settlementDay) {
                    isReminderDue = true;
                }
            }
            return { ...customer, outstandingBalance: finalBalance, isReminderDue };
        });

        const latePaymentNotifications: NotificationItem[] = customerData
            .filter(c => c.isReminderDue)
            .map(c => ({
                id: `payment-${c.id}`,
                type: 'payment',
                message: `Paiement en retard pour ${c.firstName} ${c.lastName}. Solde: ${c.outstandingBalance.toFixed(2)} DA`,
                relatedId: c.id,
                date: new Date(),
                isRead: false
            }));

        const allNotifications = [...lowStockNotifications, ...latePaymentNotifications];
        
        return {
            notifications: allNotifications,
            lowStockCount: lowStockNotifications.length,
            latePaymentsCount: latePaymentNotifications.length
        };
    }, [products, customers, sales, payments]);

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter(n => n.type === filter);
    }, [notifications, filter]);

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des notifications...</p></div>;
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Centre de Notifications</h1>
                    <p className="text-muted-foreground">Alertes importantes concernant votre stock et les paiements.</p>
                </div>
                <NotificationFilters currentFilter={filter} onFilterChange={setFilter} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des Alertes</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{notifications.length}</div>
                        <p className="text-xs text-muted-foreground">Toutes les alertes actives</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertes de Stock</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Retards de Paiement</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latePaymentsCount}</div>
                        <p className="text-xs text-muted-foreground">Clients avec paiements en retard</p>
                    </CardContent>
                </Card>
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                    <div className="text-center">
                        <h3 className="text-xl font-bold tracking-tight">Tout est en ordre !</h3>
                        <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotifications.map(notification => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))}
                </div>
            )}
        </main>
    );
}
