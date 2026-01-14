'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import type { Product, Customer, Sale, Payment } from '@/lib/types';
import { getDate } from 'date-fns';
import { NotificationFilters, type FilterType } from '@/components/notifications/notification-filters';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, User, ArrowRight, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Define the NotificationItem type locally
export interface NotificationItem {
  id: string;
  type: 'stock' | 'payment';
  message: string;
  relatedId: string; // productId or customerId
  actionText: string;
  actionHref: string;
}

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

    const { notifications } = useMemo(() => {
        if (!products || !customers || !sales || !payments) {
            return { notifications: [] };
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
                actionText: 'Gérer le stock',
                actionHref: '/products'
            }));

        // 2. Late Payment Notifications
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
                actionText: 'Voir le client',
                actionHref: `/customers/${c.id}`
            }));

        const allNotifications = [...lowStockNotifications, ...latePaymentNotifications];
        
        return {
            notifications: allNotifications,
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
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold">Centre de Notifications</CardTitle>
                            <CardDescription>Alertes importantes concernant votre stock et les paiements.</CardDescription>
                        </div>
                        <NotificationFilters currentFilter={filter} onFilterChange={setFilter} />
                    </div>
                </CardHeader>

                <CardContent>
                    {filteredNotifications.length === 0 ? (
                        <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-background">
                            <div className="text-center">
                                <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-bold tracking-tight">Tout est en ordre !</h3>
                                <p className="mt-2 text-sm text-muted-foreground">Aucune notification pour le moment.</p>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            {filteredNotifications.map(notification => (
                                <div 
                                    key={notification.id}
                                    className={cn(
                                        "flex items-center gap-4 rounded-lg border p-4",
                                        notification.type === 'payment' && "border-destructive/50 bg-destructive/5"
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-full p-2",
                                        notification.type === 'stock' ? 'bg-yellow-500/20' : 'bg-destructive/20'
                                    )}>
                                        {notification.type === 'stock' 
                                            ? <Archive className="h-5 w-5 text-yellow-600" /> 
                                            : <User className="h-5 w-5 text-destructive" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{notification.message}</p>
                                    </div>
                                    <Button asChild variant="secondary" size="sm">
                                        <Link href={notification.actionHref}>
                                            {notification.actionText}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
