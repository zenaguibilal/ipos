'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, HandCoins, CircleDollarSign } from 'lucide-react';
import type { Sale, Payment, CompanyProfile, Customer } from '@/lib/types';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';
import { cn, safeToDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';


type StatusFilter = 'all' | 'paid' | 'unpaid' | 'payments';
type Transaction = { type: 'sale', data: Sale } | { type: 'payment', data: Payment };

export default function SalesHistoryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // --- Component State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

    // --- Data Fetching ---
    const salesQuery = useMemoFirebase(() => 
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'sales'), orderBy('createdAt', 'desc')) : null, 
    [user, firestore]);
    
    const paymentsQuery = useMemoFirebase(() =>
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'payments'), orderBy('createdAt', 'desc')) : null,
    [user, firestore]);
    
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);

    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    
    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const combinedTransactions = useMemo<Transaction[]>(() => {
        if (!sales && !payments) return [];
        
        const saleTransactions: Transaction[] = (sales || []).map(s => ({ type: 'sale', data: s }));
        const paymentTransactions: Transaction[] = (payments || []).map(p => ({ type: 'payment', data: p }));

        return [...saleTransactions, ...paymentTransactions]
            .sort((a, b) => safeToDate(b.data.createdAt).getTime() - safeToDate(a.data.createdAt).getTime());
    }, [sales, payments]);

    const filteredTransactions = useMemo(() => {
        if (!combinedTransactions) return [];

        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;

        return combinedTransactions.filter(transaction => {
            // Date filter first
            const transactionDate = safeToDate(transaction.data.createdAt);
            if (fromDate && transactionDate < fromDate) return false;
            if (toDate && transactionDate > toDate) return false;

            const matchesSearch = searchQuery 
                ? (transaction.data.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  ('invoiceNumber' in transaction.data && transaction.data.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())))
                : true;

            if (!matchesSearch) return false;

            switch (statusFilter) {
                case 'all':
                    return true;
                case 'paid':
                    return transaction.type === 'sale' && transaction.data.paymentStatus === 'paid';
                case 'unpaid':
                     return transaction.type === 'sale' && (transaction.data.paymentStatus === 'unpaid' || transaction.data.paymentStatus === 'partial');
                case 'payments':
                    return transaction.type === 'payment';
                default:
                    return true;
            }
        });
    }, [combinedTransactions, searchQuery, statusFilter, dateRange]);

    const { totalRevenue, totalCollected, salesCount } = useMemo(() => {
        if (!filteredTransactions) return { totalRevenue: 0, totalCollected: 0, salesCount: 0 };

        let revenue = 0;
        let collected = 0;
        let sCount = 0;

        filteredTransactions.forEach(transaction => {
            if (transaction.type === 'sale') {
                revenue += transaction.data.total;
                collected += transaction.data.amountPaid;
                sCount++;
            } else { // payment
                collected += transaction.data.amount;
            }
        });

        return { totalRevenue: revenue, totalCollected: collected, salesCount: sCount };
    }, [filteredTransactions]);


    const selectedCustomer = useMemo(() => {
        if (!selectedSale || !customers) return null;
        return customers.find(c => c.id === selectedSale.customerId) || null;
    }, [selectedSale, customers]);


    const isLoading = isUserLoading || isLoadingSales || isLoadingPayments || isLoadingCompany || isLoadingCustomers;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'historique...</p></div>;
    }

    return (
        <>
            {selectedSale && (
                <SaleDetailsDialog
                    isOpen={true}
                    onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}
                    sale={selectedSale}
                    companyProfile={companyProfile}
                    customer={selectedCustomer}
                />
            )}
             <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full bg-card">
                    <CardHeader>
                        <CardTitle>Historique des Transactions</CardTitle>
                        <CardDescription>
                            Consultez, recherchez et filtrez toutes vos transactions commerciales (ventes et paiements).
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
                           <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Rechercher par N° facture ou client..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>
                                <DateRangePicker onUpdate={setDateRange} />
                           </div>
                             <div className="flex gap-2 rounded-lg bg-muted p-1 self-start sm:self-center">
                                <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>Tout</Button>
                                <Button variant={statusFilter === 'paid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('paid')}>Payé</Button>
                                <Button variant={statusFilter === 'unpaid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('unpaid')}>Impayé/Partiel</Button>
                                <Button variant={statusFilter === 'payments' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('payments')}>Paiements</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-4 md:grid-cols-3 mb-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Chiffre d'affaires (filtré)</CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} DA</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Encaissé (filtré)</CardTitle>
                                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{totalCollected.toFixed(2)} DA</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Nombre de Ventes (filtré)</CardTitle>
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{salesCount}</div>
                                </CardContent>
                            </Card>
                        </div>
                        {filteredTransactions.length === 0 ? (
                             <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {combinedTransactions.length > 0 ? "Aucune transaction ne correspond à votre recherche." : "Aucune transaction enregistrée pour le moment."}
                                </p>
                            </div>
                        ) : (
                             <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="hidden sm:table-cell">Type</TableHead>
                                            <TableHead>Client / N° Facture</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Statut / Détails</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((transaction, index) => {
                                             const isSale = transaction.type === 'sale';
                                             
                                             return (
                                                <TableRow 
                                                    key={`${transaction.type}-${transaction.data.id}-${index}`}
                                                    onClick={() => {
                                                        if (transaction.type === 'sale') {
                                                            setSelectedSale(transaction.data);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "border-b transition-colors",
                                                        isSale ? "hover:bg-muted/50 cursor-pointer" : "bg-green-500/10"
                                                     )}
                                                >
                                                    <TableCell className="hidden sm:table-cell">
                                                        <div className="flex items-center gap-2">
                                                          {isSale ? <ShoppingCart className="h-4 w-4 text-muted-foreground"/> : <HandCoins className="h-4 w-4 text-green-500"/>}
                                                          <span>{isSale ? 'Vente' : 'Paiement'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-3 font-medium">
                                                        <div>{transaction.data.customerName || (isSale ? 'Vente au comptoir' : 'Paiement inconnu')}</div>
                                                        {isSale && <div className="font-mono text-xs text-muted-foreground">{transaction.data.invoiceNumber}</div>}
                                                    </TableCell>
                                                    <TableCell className="p-3 text-muted-foreground">
                                                        {safeToDate(transaction.data.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell className="p-3 text-center">
                                                        {isSale ? (
                                                            <span className={cn(
                                                                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                                transaction.data.paymentStatus === 'paid' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                                                                transaction.data.paymentStatus === 'partial' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                                                                transaction.data.paymentStatus === 'unpaid' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                            )}>
                                                                {transaction.data.paymentStatus === 'paid' ? 'Payé' : transaction.data.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-green-600">Règlement de dette</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        "p-3 text-right font-semibold",
                                                        isSale ? 'text-primary' : 'text-green-600'
                                                    )}>
                                                        {isSale ? transaction.data.total.toFixed(2) : `+${transaction.data.amount.toFixed(2)}`} DA
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

    