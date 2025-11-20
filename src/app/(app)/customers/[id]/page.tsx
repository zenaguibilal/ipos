
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp, doc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Duplicated interfaces for simplicity, can be moved to a shared types file
interface SaleItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Sale {
    id: string;
    invoiceNumber: string;
    items: SaleItem[];
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    customerId?: string;
    customerName?: string;
    createdAt: Timestamp; 
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
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

export default function CustomerDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Fetch this specific customer's data
    const customerDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !customerId) return null;
        return doc(firestore, 'users', user.uid, 'customers', customerId);
    }, [user, firestore, customerId]);
    const { data: customer, isLoading: isLoadingCustomer } = useDoc<Customer>(customerDocRef);

    // Fetch sales only for this customer
    const salesCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore || !customerId) return null;
        return query(
            collection(firestore, 'users', user.uid, 'sales'),
            where('customerId', '==', customerId)
        );
    }, [user, firestore, customerId]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const sortedSales = useMemo(() => {
        if (!sales) return [];
        return [...sales].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
    }, [sales]);


    const isLoading = isUserLoading || isLoadingCustomer || isLoadingSales;

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
            {selectedSale && (
                <SaleDetailsDialog
                    isOpen={!!selectedSale}
                    onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}
                    sale={selectedSale}
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
                            Historique des factures pour ce client.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSales ? (
                            <div className="text-center">Chargement des factures...</div>
                        ) : sortedSales.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Facture N°</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sortedSales.map(sale => (
                                            <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="cursor-pointer hover:bg-muted/50">
                                                <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">{sale.invoiceNumber}</td>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{format(sale.createdAt.toDate(), 'd MMM yyyy, HH:mm', { locale: fr })}</td>
                                                <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={sale.paymentStatus} /></td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{sale.total.toFixed(2)} DA</td>
                                                <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${sale.remainingBalance > 0 ? 'text-destructive' : ''}`}>{sale.remainingBalance.toFixed(2)} DA</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">
                                    Aucune facture trouvée pour ce client.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
