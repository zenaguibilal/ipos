'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Customer, Sale, Payment, CompanyProfile, CustomerWithSalesData, Product } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandCoins, ArrowRight, BellOff, MessageSquare, PackageWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { calculateAllCustomersMetrics } from '@/lib/utils';

export interface PaymentNotification {
  id: string;
  type: 'payment';
  messagePrefix: string;
  messageLinkText: string;
  messageSuffix: string;
  actionText: string;
  action?: () => void;
  customerData: CustomerWithSalesData;
}

export interface StockNotification {
  id: string;
  type: 'stock';
  message: string;
  linkHref: string;
  product: Product;
}

export default function NotificationsPage() {
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

    const customers = useLiveQuery(() => db.customers.toArray());
    const sales = useLiveQuery(() => db.sales.toArray());
    const payments = useLiveQuery(() => db.payments.toArray());
    const companyProfile = useLiveQuery(() => db.companyProfile.get(1));
    const products = useLiveQuery(() => db.products.toArray());

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

    const latePaymentNotifications = useMemo((): PaymentNotification[] => {
        if (!customers || !sales || !payments) return [];
        
        const { customersWithSalesData } = calculateAllCustomersMetrics(customers, sales, payments);

        return customersWithSalesData
            .filter(c => c.isReminderDue && c.id)
            .map(c => ({
                id: `payment-${c.id}`,
                type: 'payment',
                messagePrefix: 'Paiement en retard pour ',
                messageLinkText: `${c.firstName} ${c.lastName}`,
                messageSuffix: `. Solde: ${c.outstandingBalance.toFixed(2)} DA`,
                actionText: 'Encaisser',
                action: () => setPayingCustomer(c as Customer),
                customerData: c,
            }));
    }, [customers, sales, payments]);

    const lowStockNotifications = useMemo((): StockNotification[] => {
        if (!products) return [];
        return products
            .filter(p => p.id !== undefined && p.quantity <= p.minStockLevel)
            .map(p => ({
                id: `stock-${p.id}`,
                type: 'stock',
                message: `Stock faible pour ${p.name} (${p.quantity} restant).`,
                linkHref: `/products?search=${encodeURIComponent(p.name)}`,
                product: p,
            }));
    }, [products]);

    const isLoading = customers === undefined || sales === undefined || payments === undefined || companyProfile === undefined || products === undefined;

    const totalNotifications = latePaymentNotifications.length + lowStockNotifications.length;

    return (
        <>
            {payingCustomer && (
                <AddPaymentForm isOpen={!!payingCustomer} onOpenChange={() => setPayingCustomer(null)} customer={payingCustomer} />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Centre de Notifications</h1>
                    <p className="text-muted-foreground">Alertes importantes concernant les paiements et le stock.</p>
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
                    <div className="grid grid-cols-1 gap-6">
                        {latePaymentNotifications.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Alerte de Paiement ({latePaymentNotifications.length})</CardTitle>
                                    <CardDescription>Clients qui ont dépassé leur date de règlement.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {latePaymentNotifications.map(notification => (
                                        <div key={notification.id} className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="rounded-full p-2 bg-destructive/20">
                                                <HandCoins className="h-5 w-5 text-destructive" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {notification.messagePrefix}
                                                    <Link href={`/customers/${notification.customerData.id}`} className="font-bold hover:underline">{notification.messageLinkText}</Link>
                                                    {notification.messageSuffix}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {notification.customerData?.phone && (
                                                    <Button variant="outline" size="sm" onClick={() => handleWhatsAppReminder(notification.customerData)}>
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
                                </CardContent>
                            </Card>
                        )}
                        {lowStockNotifications.length > 0 && (
                             <Card>
                                <CardHeader>
                                    <CardTitle>Alertes de Stock Faible ({lowStockNotifications.length})</CardTitle>
                                    <CardDescription>Produits qui ont atteint ou sont en dessous du niveau de stock minimum.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     {lowStockNotifications.map(notification => (
                                        <div key={notification.id} className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900/30">
                                                <PackageWarning className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{notification.message}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <Button asChild variant="secondary" size="sm">
                                                    <Link href={notification.linkHref}>
                                                        Voir le produit <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}
