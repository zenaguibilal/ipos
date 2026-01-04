
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, Timestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, safeToDate } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { PaymentDetailsDialog } from '@/components/sales/payment-details-dialog';
import type { Sale, CompanyProfile, Payment } from '@/lib/types';


type HistoryItem = 
    | { type: 'sale'; data: Sale }
    | { type: 'payment'; data: Payment };

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
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    const salesCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'sales');
    }, [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    
    const paymentsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'payments');
    }, [user, firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

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

    const filteredHistory = useMemo(() => {
        if (!sales && !payments) return [];

        const combined: HistoryItem[] = [
            ...(sales || []).map(s => ({ type: 'sale' as const, data: s })),
            ...(payments || []).map(p => ({ type: 'payment' as const, data: p }))
        ];

        let filtered = combined;

        // Filter by search query (customer name or invoice number)
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const customerName = item.data.customerName?.toLowerCase() || '';
                if (customerName.includes(lowercasedQuery)) {
                    return true;
                }

                if (item.type === 'sale') {
                    const invoiceNumber = item.data.invoiceNumber?.toLowerCase() || '';
                    if (invoiceNumber.includes(lowercasedQuery)) {
                        return true;
                    }
                }

                return false;
            });
        }

        // Filter by date range
        if (dateRange?.from) {
             const fromDate = new Date(dateRange.from);
             fromDate.setHours(0,0,0,0);

             filtered = filtered.filter(item => {
                const itemDate = safeToDate(item.data.createdAt);
                if (dateRange.to) {
                    // Set 'to' date to the end of the day
                    const toDate = new Date(dateRange.to);
                    toDate.setHours(23, 59, 59, 999);
                    return itemDate >= fromDate && itemDate <= toDate;
                }
                // If only 'from' is selected, filter for that day
                const fromDayEnd = new Date(dateRange.from);
                fromDayEnd.setHours(23,59,59,999);
                return itemDate >= fromDate && itemDate <= fromDayEnd;
             });
        }
        
        // Sort by most recent
        return filtered.sort((a, b) => safeToDate(b.data.createdAt).getTime() - safeToDate(a.data.createdAt).getTime());

    }, [sales, payments, searchQuery, dateRange]);

    const isLoading = isUserLoading || isLoadingSales || isLoadingPayments || isLoadingCompanyProfile;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
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
                <Card className="w-full bg-card">
                    <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input 
                                placeholder="Rechercher par client ou N° facture..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-auto sm:flex-grow max-w-sm"
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
                        ) : filteredHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type / N°</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Client</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total / Montant</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Payé</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredHistory.map(item => (
                                            <tr key={`${item.type}-${item.data.id}`} onClick={() => setSelectedItem(item)} className="cursor-pointer hover:bg-muted/50">
                                                {item.type === 'sale' ? (
                                                    <>
                                                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">{item.data.invoiceNumber}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium">{format(safeToDate(item.data.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{item.data.customerName || 'Vente au comptoir'}</td>
                                                        <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={item.data.paymentStatus} /></td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{item.data.total.toFixed(2)} DA</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-green-400">{item.data.amountPaid.toFixed(2)} DA</td>
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
                                                        <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{item.data.customerName || '-'}</td>
                                                        <td className="whitespace-nowrap px-6 py-4"><span className="text-green-400 font-semibold">Règlement</span></td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-green-500">{item.data.amount.toFixed(2)} DA</td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right">-</td>
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
                                    {(sales && sales.length === 0 && payments && payments.length === 0) ? "Vous n'avez pas encore de transactions enregistrées." : "Aucune transaction ne correspond à vos filtres."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

    