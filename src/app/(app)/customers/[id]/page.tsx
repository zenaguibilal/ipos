
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from "@/components/ui/timeline";
import { ArrowLeft, Edit, HandCoins, Mail, Phone, CreditCard, ShoppingCart, FileText } from 'lucide-react';
import Link from 'next/link';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Customer, Sale, Payment } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { Badge } from '@/components/ui/badge';

type Transaction = { type: 'sale', data: Sale } | { type: 'payment', data: Payment };

export default function CustomerDetailPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    // State for dialogs
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Data fetching
    const customerRef = useMemoFirebase(() => (user && firestore && customerId) ? doc(firestore, 'users', user.uid, 'customers', customerId) : null, [user, firestore, customerId]);
    const salesQuery = useMemoFirebase(() => (user && firestore && customerId) ? query(collection(firestore, 'users', user.uid, 'sales'), where('customerId', '==', customerId)) : null, [user, firestore, customerId]);
    const paymentsQuery = useMemoFirebase(() => (user && firestore && customerId) ? query(collection(firestore, 'users', user.uid, 'payments'), where('customerId', '==', customerId)) : null, [user, firestore, customerId]);

    const { data: customer, isLoading: isLoadingCustomer } = useDoc<Customer>(customerRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { totalSpent, outstandingBalance, combinedTransactions } = useMemo(() => {
        if (!sales || !payments) return { totalSpent: 0, outstandingBalance: 0, combinedTransactions: [] };

        const customerSales = sales || [];
        const customerPayments = payments || [];

        const totalSaleAmount = customerSales.reduce((acc, s) => acc + s.total, 0);
        const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
        const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
        
        const balance = totalSaleAmount - totalPaidFromSales - totalStandalonePayments;
        const finalBalance = balance < 0.01 ? 0 : balance;

        const saleTransactions: Transaction[] = customerSales.map(s => ({ type: 'sale', data: s }));
        const paymentTransactions: Transaction[] = customerPayments.map(p => ({ type: 'payment', data: p }));

        const allTransactions = [...saleTransactions, ...paymentTransactions].sort((a, b) => {
            const timeB = b.data.createdAt ? safeToDate(b.data.createdAt).getTime() : 0;
            const timeA = a.data.createdAt ? safeToDate(a.data.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        return {
            totalSpent: totalSaleAmount,
            outstandingBalance: finalBalance,
            combinedTransactions: allTransactions,
        };
    }, [sales, payments]);

    const isLoading = isUserLoading || isLoadingCustomer || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement du profil client...</p></div>;
    }

    if (!customer && !isLoading) {
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
            {customer && user && (
                 <CustomerDialog
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    customer={customer}
                    userId={user.uid}
                />
            )}
             {customer && user && (
                <AddPaymentForm
                    isOpen={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    customer={customer}
                    userId={user.uid}
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
                    {/* Left Column: Customer Info & Stats */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">{customer.firstName} {customer.lastName}</CardTitle>
                                {customer.phone && (
                                     <CardDescription className="flex items-center gap-2 pt-2">
                                        <Phone className="h-4 w-4" /> {customer.phone}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Button className="flex-1" onClick={() => setIsPaymentOpen(true)}>
                                    <HandCoins className="mr-2 h-4 w-4"/> Encaisser Paiement
                                </Button>
                                 <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4"/> Modifier
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Statistiques du Client</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Dette Actuelle</span>
                                    <span className="font-bold text-2xl text-destructive">{outstandingBalance.toFixed(1)} DA</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Dépensé</span>
                                    <span className="font-semibold text-lg">{totalSpent.toFixed(1)} DA</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Client depuis</span>
                                    <span className="font-semibold">{format(safeToDate(customer.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Transaction History */}
                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>Historique des Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {combinedTransactions.length === 0 ? (
                                    <p className="text-muted-foreground">Aucune transaction pour ce client.</p>
                                ) : (
                                    <Timeline>
                                        {combinedTransactions.map((tx, index) => (
                                            <TimelineItem key={`${tx.type}-${tx.data.id}`}>
                                                {index < combinedTransactions.length - 1 && <TimelineConnector />}
                                                <TimelineHeader>
                                                    <TimelineIcon>
                                                        {tx.type === 'sale' ? <ShoppingCart className="h-5 w-5"/> : <CreditCard className="h-5 w-5 text-green-500" />}
                                                    </TimelineIcon>
                                                    <TimelineTitle>
                                                        {tx.type === 'sale' ? 'Vente' : 'Paiement'}
                                                    </TimelineTitle>
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        {tx.data.createdAt ? format(safeToDate(tx.data.createdAt), 'd MMM yyyy, HH:mm', { locale: fr }) : ''}
                                                    </span>
                                                </TimelineHeader>
                                                <TimelineBody>
                                                     <div className="bg-muted/50 p-4 rounded-md border">
                                                        {tx.type === 'sale' ? (
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p>Facture <Link href={`/sales-history?search=${tx.data.invoiceNumber}`} className="font-mono underline hover:text-primary">{tx.data.invoiceNumber}</Link></p>
                                                                    <p className="text-xs text-muted-foreground">{tx.data.items.length} article(s)</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-lg">{tx.data.total.toFixed(1)} DA</p>
                                                                    {tx.data.paymentStatus === 'unpaid' && <Badge variant="destructive">Impayé</Badge>}
                                                                    {tx.data.paymentStatus === 'partial' && <Badge variant="secondary">Partiel</Badge>}
                                                                    {tx.data.paymentStatus === 'paid' && <Badge>Payé</Badge>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-center">
                                                                <p>Règlement de dette</p>
                                                                <p className="font-bold text-lg text-green-600">+{tx.data.amount.toFixed(1)} DA</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TimelineBody>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    )
}
