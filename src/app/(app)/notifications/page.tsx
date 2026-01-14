
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import type { Product, Customer, Sale, Payment } from '@/lib/types';
import { getDate } from 'date-fns';
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

    const { lowStockNotifications, latePaymentNotifications } = useMemo(() => {
        if (!products || !customers || !sales || !payments) {
            return { lowStockNotifications: [], latePaymentNotifications: [] };
        }

        const today = new Date();
        const currentDayOfMonth = getDate(today);

        // 1. Low Stock Notifications
        const stockNotifications: NotificationItem[] = products
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

        const paymentNotifications: NotificationItem[] = customerData
            .filter(c => c.isReminderDue)
            .map(c => ({
                id: `payment-${c.id}`,
                type: 'payment',
                message: `Paiement en retard pour ${c.firstName} ${c.lastName}. Solde: ${c.outstandingBalance.toFixed(2)} DA`,
                relatedId: c.id,
                actionText: 'Voir le client',
                actionHref: `/customers/${c.id}`
            }));
        
        return {
            lowStockNotifications: stockNotifications,
            latePaymentNotifications: paymentNotifications
        };
    }, [products, customers, sales, payments]);

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des notifications...</p></div>;
    }

    const totalNotifications = lowStockNotifications.length + latePaymentNotifications.length;

    const renderNotificationList = (notifications: NotificationItem[], type: 'stock' | 'payment') => {
        const iconBg = type === 'stock' ? 'bg-yellow-500/20' : 'bg-destructive/20';
        const icon = type === 'stock' ? <Archive className="h-5 w-5 text-yellow-600" /> : <User className="h-5 w-5 text-destructive" />;

        return (
            <div className="space-y-4">
                {notifications.map(notification => (
                    <div 
                        key={notification.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                    >
                        <div className={cn("rounded-full p-2", iconBg)}>
                            {icon}
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
        );
    };

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Centre de Notifications</h1>
                <p className="text-muted-foreground">Alertes importantes concernant votre stock et les paiements.</p>
            </div>
            
            {totalNotifications === 0 && !isLoading ? (
                <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                    <div className="text-center">
                        <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-bold tracking-tight">Tout est en ordre !</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Aucune notification pour le moment.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alerte de Stock Faible ({lowStockNotifications.length})</CardTitle>
                            <CardDescription>Produits qui nécessitent un réapprovisionnement.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {lowStockNotifications.length > 0 ? 
                                renderNotificationList(lowStockNotifications, 'stock') : 
                                <p className="text-sm text-muted-foreground">Aucun produit en stock faible.</p>
                            }
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alerte de Paiement ({latePaymentNotifications.length})</CardTitle>
                            <CardDescription>Clients qui ont dépassé leur date de règlement.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {latePaymentNotifications.length > 0 ? 
                                renderNotificationList(latePaymentNotifications, 'payment') : 
                                <p className="text-sm text-muted-foreground">Aucun paiement en retard.</p>
                            }
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}
