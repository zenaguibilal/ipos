
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';

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

export default function SalesHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const salesCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'sales');
    }, [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const filteredSales = useMemo(() => {
        if (!sales) return [];

        let filtered = sales;

        // Filter by search query (customer name or invoice number)
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(sale => 
                sale.customerName?.toLowerCase().includes(lowercasedQuery) ||
                sale.invoiceNumber?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Filter by date range
        if (dateRange?.from) {
             filtered = filtered.filter(sale => {
                const saleDate = sale.createdAt.toDate();
                if (dateRange.to) {
                    // Set 'to' date to the end of the day
                    const toDate = new Date(dateRange.to);
                    toDate.setHours(23, 59, 59, 999);
                    return saleDate >= dateRange.from && saleDate <= toDate;
                }
                // If only 'from' is selected, filter for that day
                const fromDayStart = new Date(dateRange.from.setHours(0,0,0,0));
                const fromDayEnd = new Date(dateRange.from.setHours(23,59,59,999));
                return saleDate >= fromDayStart && saleDate <= fromDayEnd;
             });
        }
        
        // Sort by most recent
        return filtered.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

    }, [sales, searchQuery, dateRange]);

    const isLoading = isUserLoading || isLoadingSales;

    if (isLoading || !user) {
        return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>;
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
            <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
                <Card className="w-full max-w-7xl">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Historique des Ventes</CardTitle>
                                <CardDescription>Consultez, recherchez et filtrez vos ventes passées.</CardDescription>
                            </div>
                        </div>
                         <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                            <Input 
                                placeholder="Rechercher par client ou N° facture..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64"
                            />
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal sm:w-auto",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "d LLL y", { locale: fr })} - {format(dateRange.to, "d LLL y", { locale: fr })}
                                        </>
                                    ) : (
                                        format(dateRange.from, "d LLL y", { locale: fr })
                                    )
                                    ) : (
                                    <span>Choisir une date</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={fr}
                                    />
                                </PopoverContent>
                            </Popover>
                            {(searchQuery || dateRange) && (
                                <Button variant="ghost" onClick={() => { setSearchQuery(''); setDateRange(undefined); }}>
                                    Effacer les filtres
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : filteredSales.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Facture N°</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Payé</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredSales.map(sale => (
                                            <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="cursor-pointer hover:bg-muted/50">
                                                <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">{sale.invoiceNumber}</td>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{format(sale.createdAt.toDate(), 'd MMM yyyy, HH:mm', { locale: fr })}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{sale.customerName || 'Vente au comptoir'}</td>
                                                <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={sale.paymentStatus} /></td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{sale.total.toFixed(2)} €</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-green-400">{sale.amountPaid.toFixed(2)} €</td>
                                                <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${sale.remainingBalance > 0 ? 'text-destructive' : ''}`}>{sale.remainingBalance.toFixed(2)} €</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">
                                    {sales && sales.length === 0 ? "Vous n'avez pas encore de ventes enregistrées." : "Aucune vente ne correspond à vos filtres."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
            </div>
        </>
    );
}
