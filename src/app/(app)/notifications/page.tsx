'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, Sale, Payment, CompanyProfile, CustomerWithSalesData } from '@/lib/types';
import { getDate } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandCoins, ArrowRight, BellOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { calculateAllCustomersMetrics } from '@/lib/utils';


export interface NotificationItem {
  id: string;
  type: 'payment';
  messagePrefix: string;
  messageLinkText: string;
  messageSuffix: string;
  linkHref: string;
  relatedId: number; 
  actionText: string;
  action?: () => void;
  customerData?: CustomerWithSalesData;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

    const customers = useLiveQuery(() => db.customers.toArray());
    const sales = useLiveQuery(() => db.sales.toArray());
    const payments = useLiveQuery(() => db.payments.toArray());
    const companyProfile = useLiveQuery(() => db.companyProfile.get(1));

    const handleWhatsAppReminder = (customer: CustomerWithSalesData) => {
        if (!customer.phone) {
            toast.error("Le numéro de téléphone de ce client n'est pas disponible.");
            return;
        }

        const companyName = companyProfile?.companyName || 'votre magasin';
        const message = `Bonjour ${customer.firstName} ${customer.lastName}, ceci est un rappel amical concernant votre solde impayé de ${customer.outstandingBalance.toFixed(2)} DA chez ${companyName}. Merci de régler votre dette dès que possible.`;
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const { latePaymentNotifications } = useMemo(() => {
        if (!customers || !sales || !payments) {
            return { latePaymentNotifications: [] };
        }
        
        const { customersWithSalesData } = calculateAllCustomersMetrics(customers, sales, payments);

        const paymentNotifications: NotificationItem[] = customersWithSalesData
            .filter(c => c.isReminderDue && c.id)
            .map(c => ({
                id: `payment-${c.id}`,
                type: 'payment',
                messagePrefix: 'Paiement en retard pour ',
                messageLinkText: `${c.firstName} ${c.lastName}`,
                messageSuffix: `. Solde: ${c.outstandingBalance.toFixed(2)} DA`,
                linkHref: `/sales-history`,
                relatedId: c.id!,
                actionText: 'Encaisser',
                action: () => setPayingCustomer(c as Customer),
                customerData: c,
            }));
        
        return {
            latePaymentNotifications: paymentNotifications
        };
    }, [customers, sales, payments]);

    const isLoading = customers === undefined || sales === undefined || payments === undefined || companyProfile === undefined;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des notifications...</p></div>;
    }

    const totalNotifications = latePaymentNotifications.length;

    const renderNotificationList = (notifications: NotificationItem[], type: 'payment') => {
        const iconBg = 'bg-destructive/20';
        const icon = <HandCoins className="h-5 w-5 text-destructive" />;

        return (
            <div className="space-y-4">
                {notifications.map(notification => (
                    <div key={notification.id} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className={cn("rounded-full p-2", iconBg)}>{icon}</div>
                        <div className="flex-1">
                            <p className="font-medium">
                                {notification.messagePrefix}
                                <span className="font-bold">{notification.messageLinkText}</span>
                                {notification.messageSuffix}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {notification.type === 'payment' && notification.customerData?.phone && (
                                <Button variant="outline" size="sm" onClick={() => handleWhatsAppReminder(notification.customerData as CustomerWithSalesData)}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Rappel
                                </Button>
                            )}
                            {notification.action && (
                                <Button variant="secondary" size="sm" onClick={notification.action}>
                                    {notification.actionText} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {payingCustomer && (
                <AddPaymentForm isOpen={!!payingCustomer} onOpenChange={() => setPayingCustomer(null)} customer={payingCustomer} />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Centre de Notifications</h1>
                    <p className="text-muted-foreground">Alertes importantes concernant les paiements.</p>
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
                    <div className="grid grid-cols-1">
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
        </>
    );
}
