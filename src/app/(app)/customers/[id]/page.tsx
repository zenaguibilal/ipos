
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp, doc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, safeToDate } from '@/lib/utils';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { PaymentDetailsDialog } from '@/components/sales/payment-details-dialog';
import Link from 'next/link';
import { ArrowLeft, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale, Customer, CompanyProfile, Payment } from '@/lib/types';


type HistoryItem = 
    | { type: 'sale'; data: Sale }
    | { type: 'payment'; data: Payment };

export default function CustomerDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    // Fetch this specific customer's data
    const customerDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !customerId) return null;
        return doc(firestore, 'users', user.uid, 'customers', customerId);
    }, [user, firestore, customerId]);
    const { data: customer, isLoading: isLoadingCustomer } = useDoc<Customer>(customerDocRef);

    // Fetch sales only for this customer
    const salesQuery = useMemoFirebase(() => {
        if (!user || !firestore || !customerId) return null;
        return query(
            collection(firestore, 'users', user.uid, 'sales'),
            where('customerId', '==', customerId)
        );
    }, [user, firestore, customerId]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);

    // Fetch payments only for this customer
    const paymentsQuery = useMemoFirebase(() => {
        if (!user || !firestore || !customerId) return null;
        return query(
            collection(firestore, 'users', user.uid, 'payments'),
            where('customerId', '==', customerId)
        );
    }, [user, firestore, customerId]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    
    // Fetch Company Profile
    const companyDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid, 'companyProfile', 'main');
    }, [user, firestore]);
    const { data: companyProfile, isLoading: isLoadingCompanyProfile } = useDoc<CompanyProfile>(companyDocRef);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const sortedHistory = useMemo(() => {
        if (!sales && !payments) return [];

        const combined: HistoryItem[] = [
            ...(sales || []).map(s => ({ type: 'sale' as const, data: s })),
            ...(payments || []).map(p => ({ type: 'payment' as const, data: p }))
        ];
        
        // Sort by most recent
        return combined.sort((a, b) => safeToDate(b.data.createdAt).getTime() - safeToDate(a.data.createdAt).getTime());
    }, [sales, payments]);


    const isLoading = isUserLoading || isLoadingCustomer || isLoadingSales || isLoadingPayments || isLoadingCompanyProfile;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des détails du client...</p></div>;
    }
    
    if (!customer && !isLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-4">
                <p>Client non trouvé.</p>
                <Button asChild variant="outline">
                    <Link href="/customers">Retour à la liste des clients</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            {selectedItem?.type === 'sale' && (
                <SaleDetailsDialog
                    isOpen={true}
                    onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}
                    sale={selectedItem.data}
                    companyProfile={companyProfile}
                />
            )}
             {selectedItem?.type === 'payment' && (
                <PaymentDetailsDialog
                    isOpen={true}
                    onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}
                    payment={selectedItem.data}
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
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">{customer?.firstName} {customer?.lastName}</CardTitle>
                        <CardDescription>
                            Historique des transactions pour ce client.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement de l'historique...</div>
                        ) : sortedHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type / N° Facture</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Montant / Total</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde Restant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sortedHistory.map((item, index) => (
                                            <tr key={`${item.type}-${item.data.id}`} onClick={() => setSelectedItem(item)} className="cursor-pointer hover:bg-muted/50">
                                                {item.type === 'sale' ? (
                                                    <>
                                                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">{item.data.invoiceNumber}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{format(safeToDate(item.data.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</td>
                                                        <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={item.data.paymentStatus} /></td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{item.data.total.toFixed(2)} DA</td>
                                                        <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${item.data.remainingBalance > 0 ? 'text-destructive' : ''}`}>{item.data.remainingBalance.toFixed(2)} DA</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Receipt className="h-4 w-4 text-green-500" />
                                                                <span>Paiement</span>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{format(safeToDate(item.data.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</td>
                                                        <td className="whitespace-nowrap px-6 py-4"><span className="text-green-400 font-semibold">Règlement</span></td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-green-500">{item.data.amount.toFixed(2)} DA</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right">-</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">
                                    Aucune transaction trouvée pour ce client.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

function StatusBadge({ status }: { status: Sale['paymentStatus'] }) {
    return (
        <span className={cn(
            'rounded-full px-2 py-1 text-xs font-semibold',
            status === 'paid' && 'bg-green-500/20 text-green-400',
            status === 'partial' && 'bg-yellow-500/20 text-yellow-400',
            status === 'unpaid' && 'bg-red-500/20 text-red-400',
        )}>
            {status === 'paid' && 'Payé'}
            {status === 'partial' && 'Partiel'}
            {status === 'unpaid' && 'Impayé'}
        </span>
    );
}

    