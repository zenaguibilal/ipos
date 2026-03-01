'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Phone, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Customer, Sale, Payment } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { useCustomerMetrics } from '@/hooks/useCustomerMetrics';


export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = parseInt(params.id as string, 10);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);
    const sales = useLiveQuery(() => db.sales.where('customerId').equals(customerId).reverse().toArray(), [customerId]);
    const payments = useLiveQuery(() => db.payments.where('customerId').equals(customerId).reverse().toArray(), [customerId]);

    const metrics = useCustomerMetrics(customerId, sales, payments);

    const combinedActivity = useMemo(() => {
        if (!sales || !payments) return [];
        const activities: (Sale | Payment)[] = [...sales, ...payments];
        return activities.sort((a, b) => safeToDate(b.createdAt!).getTime() - safeToDate(a.createdAt!).getTime());
    }, [sales, payments]);

    const isLoading = customer === undefined || sales === undefined || payments === undefined;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><p>Chargement du profil client...</p></div>;
    }

    if (!customer) {
        return (
             <div className="flex h-full items-center justify-center">
                 <div className="text-center">
                     <p className="text-xl font-semibold">Client non trouvé</p>
                     <p className="text-muted-foreground">Ce client n'existe pas ou a été supprimé.</p>
                     <Button asChild className="mt-4">
                         <Link href="/customers">Retour à la liste des clients</Link>
                     </Button>
                 </div>
            </div>
        );
    }

    return (
        <>
            {customer && (
                 <CustomerDialog
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    customer={customer}
                />
            )}
             {customer && metrics && (
                <AddPaymentDialog
                    isOpen={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    customer={customer}
                    outstandingBalance={metrics.outstandingBalance}
                />
             )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux clients
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                     <div className="bg-muted p-3 rounded-full">
                                        <User className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{customer.firstName} {customer.lastName}</CardTitle>
                                        {customer.phone && (
                                            <CardDescription className="flex items-center gap-2 pt-2">
                                                <Phone className="h-4 w-4" /> {customer.phone}
                                            </CardDescription>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                 <Button variant="secondary" onClick={() => setIsEditOpen(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4"/> Modifier
                                </Button>
                                <Button variant="default" onClick={() => setIsPaymentOpen(true)} className="w-full">
                                    Ajouter un paiement
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Client depuis</span>
                                    <span className="font-semibold">{customer.createdAt ? format(safeToDate(customer.createdAt), 'd MMM yyyy', { locale: fr }) : 'N/A'}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Dernière activité</span>
                                    <span className="font-semibold">{metrics.lastActivityDate ? format(safeToDate(metrics.lastActivityDate), 'd MMM yyyy', { locale: fr }) : 'Aucune'}</span>
                                </div>
                            </CardContent>
                        </Card>
                        {metrics && <CustomerMetrics metrics={metrics} />}
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>Activité du Client</CardTitle>
                                <CardDescription>Historique des ventes et des paiements pour ce client.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CustomerActivity activity={combinedActivity} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    )
}
