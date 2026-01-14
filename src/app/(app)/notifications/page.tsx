'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection } from 'firebase/firestore';
import type { Product, Customer, Sale, Payment } from '@/lib/types';
import { getDate } from 'date-fns';
import { NotificationFilters, type FilterType } from '@/components/notifications/notification-filters';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Archive, User, ArrowRight, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Define the NotificationItem type locally as it might be specific to this page now
export interface NotificationItem {
  id: string;
  type: 'stock' | 'payment';
  message: string;
  relatedId: string; // productId or customerId
  date: Date;
  isRead: boolean;
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
                date: new Date(), 
                isRead: false
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
                date: new Date(),
                isRead: false
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

    const handleActionClick = (notification: NotificationItem) => {
        if (notification.type === 'stock') {
            router.push('/products');
        } else if (notification.type === 'payment') {
            router.push(`/customers/${notification.relatedId}`);
        }
    };


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
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Type</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead className="w-[180px] hidden md:table-cell">Date</TableHead>
                                        <TableHead className="w-[100px] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNotifications.map(notification => (
                                        <TableRow key={notification.id}>
                                            <TableCell>
                                                <div className={cn("flex items-center gap-2 font-semibold",
                                                    notification.type === 'stock' ? 'text-yellow-600' : 'text-destructive'
                                                )}>
                                                    {notification.type === 'stock' ? <Archive className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                    <span>{notification.type === 'stock' ? 'Stock' : 'Paiement'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{notification.message}</TableCell>
                                            <TableCell className="hidden md:table-cell">{format(notification.date, 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleActionClick(notification)}>
                                                    Voir <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
