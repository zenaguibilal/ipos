'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, CreditCard, HandCoins, CircleDollarSign, Download, ChevronDown, TrendingUp, MoreHorizontal, Trash2, FileText, MessageSquare, BellRing } from 'lucide-react';
import type { Sale, Payment, CompanyProfile, Customer, SaleItem } from '@/lib/types';
import { cn, safeToDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const SaleDetailsDialog = dynamic(() => import('@/components/sales/sale-details-dialog').then(mod => mod.SaleDetailsDialog));


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
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);


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
            .sort((a, b) => {
                const timeB = b.data.createdAt ? safeToDate(b.data.createdAt).getTime() : 0;
                const timeA = a.data.createdAt ? safeToDate(a.data.createdAt).getTime() : 0;
                return timeB - timeA;
            });
    }, [sales, payments]);

    const { groupedTransactions, totalRevenue, totalCollected, salesCount, totalProfit } = useMemo(() => {
        if (!combinedTransactions) {
            return { groupedTransactions: {}, totalRevenue: 0, totalCollected: 0, salesCount: 0, totalProfit: 0 };
        }

        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;
        let runningRevenue = 0;
        let runningCollected = 0;
        let runningSalesCount = 0;
        let runningProfit = 0;

        const filtered = combinedTransactions.filter(transaction => {
            if (!transaction.data.createdAt) return false;
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
        
        const groups = filtered.reduce((acc, transaction) => {
            if (!transaction.data.createdAt) return acc;
            const dateStr = format(safeToDate(transaction.data.createdAt), 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = {
                    transactions: [],
                    dailyRevenue: 0,
                    dailyCollected: 0,
                    dailyProfit: 0,
                };
            }
            acc[dateStr].transactions.push(transaction);

            if (transaction.type === 'sale') {
                acc[dateStr].dailyRevenue += transaction.data.total;
                acc[dateStr].dailyCollected += transaction.data.amountPaid;

                let saleProfit = 0;
                transaction.data.items.forEach((item: SaleItem) => {
                    const purchasePrice = typeof item.purchasePrice === 'number' ? item.purchasePrice : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : (item.cartQuantity || 0);
                    saleProfit += (item.price - purchasePrice) * quantity;
                });
                acc[dateStr].dailyProfit += saleProfit;

                runningRevenue += transaction.data.total;
                runningCollected += transaction.data.amountPaid;
                runningSalesCount++;
                runningProfit += saleProfit;
            } else { // payment
                acc[dateStr].dailyCollected += transaction.data.amount;
                runningCollected += transaction.data.amount;
            }

            return acc;
        }, {} as Record<string, { transactions: Transaction[], dailyRevenue: number, dailyCollected: number, dailyProfit: number }>);
        
        return { 
            groupedTransactions: groups, 
            totalRevenue: runningRevenue, 
            totalCollected: runningCollected, 
            salesCount: runningSalesCount,
            totalProfit: runningProfit,
        };

    }, [combinedTransactions, searchQuery, statusFilter, dateRange]);


    const selectedCustomer = useMemo(() => {
        if (!selectedSale || !customers) return null;
        return customers.find(c => c.id === selectedSale.customerId) || null;
    }, [selectedSale, customers]);

    const handleExportToCSV = () => {
        const transactionsToExport = Object.values(groupedTransactions).flatMap(g => g.transactions);
        if (transactionsToExport.length === 0) {
            toast.info("Aucune transaction à exporter.");
            return;
        }

        const csvData = transactionsToExport.map(transaction => {
            const date = transaction.data.createdAt ? safeToDate(transaction.data.createdAt).toISOString() : '';
            const customerName = transaction.data.customerName || 'N/A';

            if (transaction.type === 'sale') {
                const sale = transaction.data;
                return {
                    "Date": date,
                    "Type": "Vente",
                    "Référence": sale.invoiceNumber,
                    "Client": customerName,
                    "Statut Paiement": sale.paymentStatus,
                    "Total Vente": sale.total,
                    "Montant Payé": sale.amountPaid,
                    "Solde Restant": sale.remainingBalance,
                    "Nombre d'articles": sale.items.length
                };
            } else { // payment
                const payment = transaction.data;
                return {
                    "Date": date,
                    "Type": "Paiement",
                    "Référence": `P-${payment.id.substring(0, 7)}`,
                    "Client": customerName,
                    "Statut Paiement": "N/A",
                    "Total Vente": 0,
                    "Montant Payé": payment.amount,
                    "Solde Restant": 0,
                    "Nombre d'articles": 0
                };
            }
        });

        const csv = Papa.unparse(csvData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const fromDateStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
        const toDateStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'end';
        link.setAttribute('download', `historique_transactions_${fromDateStr}_a_${toDateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Historique des transactions exporté avec succès.");
    };

    const handleDeleteTransaction = () => {
        if (!transactionToDelete || !firestore || !user) return;
    
        const { type, data } = transactionToDelete;
        const collectionName = type === 'sale' ? 'sales' : 'payments';
        const docRef = doc(firestore, 'users', user.uid, collectionName, data.id);
    
        deleteDocumentNonBlocking(docRef, {
            onSuccess: () => {
                toast.success(`La transaction a été supprimée.`);
                setTransactionToDelete(null);
            },
            onError: (err) => {
                toast.error("Erreur lors de la suppression de la transaction.");
                console.error(err);
                setTransactionToDelete(null);
            }
        });
    };

    const handleSendReceipt = (sale: Sale) => {
        if (!customers || !sale.customerId) {
            toast.error("Informations client non disponibles pour cette vente.");
            return;
        }

        const customer = customers.find(c => c.id === sale.customerId);
        if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone de ce client n'est pas disponible.");
            return;
        }

        const companyName = companyProfile?.companyName || 'votre magasin';
        const message = `Bonjour ${customer.firstName} ${customer.lastName}, voici un récapitulatif de votre facture N°${sale.invoiceNumber}. Total: ${sale.total.toFixed(1)} DA, Montant Payé: ${sale.amountPaid.toFixed(1)} DA, Solde Restant: ${sale.remainingBalance.toFixed(1)} DA. Merci de votre confiance !`;
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleSendReminder = (sale: Sale) => {
        if (!customers || !sale.customerId) {
            toast.error("Informations client non disponibles pour cette vente.");
            return;
        }

        const customer = customers.find(c => c.id === sale.customerId);
        if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone de ce client n'est pas disponible pour un rappel.");
            return;
        }

        const companyName = companyProfile?.companyName || 'votre magasin';
        const message = `Bonjour ${customer.firstName} ${customer.lastName}, ceci est un rappel amical concernant votre facture N°${sale.invoiceNumber} chez ${companyName}. Le solde restant est de ${sale.remainingBalance.toFixed(1)} DA. Merci de régler votre dette dès que possible.`;
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };


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
             {transactionToDelete && (
                <AlertDialog open={!!transactionToDelete} onOpenChange={(isOpen) => !isOpen && setTransactionToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible et affectera les soldes des clients et les rapports.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTransaction} className={cn(buttonVariants({ variant: "destructive" }))}>
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
             <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full bg-card">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Historique des Transactions</CardTitle>
                                <CardDescription>
                                    Consultez et exportez toutes vos transactions commerciales.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 items-center">
                                <DateRangePicker onUpdate={setDateRange} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Actions <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleExportToCSV}>
                                            <Download className="mr-2 h-4 w-4" /> Exporter la vue en CSV
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t mt-4">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Rechercher par N° facture ou client..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                            <div className="flex gap-2 rounded-lg bg-muted p-1">
                                <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>Tout</Button>
                                <Button variant={statusFilter === 'paid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('paid')}>Payé</Button>
                                <Button variant={statusFilter === 'unpaid' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('unpaid')}>Impayé/Partiel</Button>
                                <Button variant={statusFilter === 'payments' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('payments')}>Paiements</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalRevenue.toFixed(1)} DA</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Bénéfice net</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{totalProfit.toFixed(1)} DA</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Encaissé</CardTitle>
                                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{totalCollected.toFixed(1)} DA</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Solde Impayé</CardTitle>
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">{(totalRevenue - totalCollected).toFixed(1)} DA</div>
                                </CardContent>
                            </Card>
                        </div>
                        {Object.keys(groupedTransactions).length === 0 ? (
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
                                            <TableHead>Heure</TableHead>
                                            <TableHead>Statut / Détails</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(groupedTransactions).map(([dateStr, group]) => (
                                            <React.Fragment key={dateStr}>
                                                <TableRow className="bg-muted hover:bg-muted">
                                                    <TableCell colSpan={6} className="py-2 px-4 font-medium text-foreground">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                            <span className="font-semibold text-base">{format(new Date(dateStr + 'T12:00:00'), 'eeee d MMMM yyyy', { locale: fr })}</span>
                                                            <div className="sm:text-right text-xs flex flex-wrap gap-x-4 gap-y-1 justify-start sm:justify-end">
                                                                <span>Bénéfice: <span className="font-bold text-green-600">{group.dailyProfit.toFixed(1)} DA</span></span>
                                                                <span>C.A.: <span className="font-bold">{group.dailyRevenue.toFixed(1)} DA</span></span>
                                                                <span>Encaissé: <span className="font-bold text-green-600">{group.dailyCollected.toFixed(1)} DA</span></span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {group.transactions.map((transaction, index) => {
                                                     if (!transaction.data.createdAt) return null;
                                                     const currentDate = safeToDate(transaction.data.createdAt);
                                                     const isSale = transaction.type === 'sale';
                                                     const saleData = isSale ? transaction.data as Sale : null;
                                                     const customerForSale = saleData?.customerId && customers ? customers.find(c => c.id === saleData.customerId) : null;
                                                     const canSendWhatsApp = !!(customerForSale && customerForSale.phone);

                                                     return (
                                                        <TableRow 
                                                            key={`${transaction.type}-${transaction.data.id}-${index}`}
                                                            className={cn(
                                                                "border-b transition-colors",
                                                                !isSale && "bg-green-500/10"
                                                            )}
                                                        >
                                                            <TableCell className="hidden sm:table-cell">
                                                                <div className="flex items-center gap-2">
                                                                {isSale ? <CreditCard className="h-4 w-4 text-muted-foreground"/> : <HandCoins className="h-4 w-4 text-green-500"/>}
                                                                <span>{isSale ? 'Vente' : 'Paiement'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="p-3 font-medium">
                                                                <div>{transaction.data.customerName || (isSale ? 'Vente au comptoir' : 'Paiement inconnu')}</div>
                                                                {isSale && <div className="font-mono text-xs text-muted-foreground">{transaction.data.invoiceNumber}</div>}
                                                            </TableCell>
                                                            <TableCell className="p-3 text-muted-foreground">
                                                                {currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                            </TableCell>
                                                            <TableCell className="p-3 text-center">
                                                                {isSale && saleData ? (
                                                                    <span className={cn(
                                                                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                                        saleData.paymentStatus === 'paid' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                                                                        saleData.paymentStatus === 'partial' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                                                                        saleData.paymentStatus === 'unpaid' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                                    )}>
                                                                        {saleData.paymentStatus === 'paid' ? 'Payé' : saleData.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                                                                    </span>
                                                                ) : !isSale ? (
                                                                    <span className="text-xs text-green-600">Règlement de dette</span>
                                                                ) : null}
                                                            </TableCell>
                                                            <TableCell className={cn(
                                                                "p-3 text-right font-semibold",
                                                                isSale ? 'text-primary' : 'text-green-600'
                                                            )}>
                                                                {isSale && saleData ? saleData.total.toFixed(1) : `+${transaction.data.amount.toFixed(1)}`} DA
                                                            </TableCell>
                                                             <TableCell className="p-3 text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                                            <span className="sr-only">Ouvrir le menu</span>
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        {isSale && saleData && (
                                                                            <>
                                                                                <DropdownMenuItem onClick={() => setSelectedSale(saleData)} className="cursor-pointer">
                                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                                    <span>Voir les détails</span>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => handleSendReceipt(saleData)} disabled={!canSendWhatsApp} className="cursor-pointer">
                                                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                                                    <span>Envoyer Reçu</span>
                                                                                </DropdownMenuItem>
                                                                                {(saleData.paymentStatus === 'unpaid' || saleData.paymentStatus === 'partial') && (
                                                                                    <DropdownMenuItem onClick={() => handleSendReminder(saleData)} disabled={!canSendWhatsApp} className="cursor-pointer">
                                                                                        <BellRing className="mr-2 h-4 w-4" />
                                                                                        <span>Envoyer Rappel</span>
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                <DropdownMenuSeparator />
                                                                            </>
                                                                        )}
                                                                        <DropdownMenuItem onClick={() => setTransactionToDelete(transaction)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer">
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Supprimer
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                     );
                                                })}
                                            </React.Fragment>
                                        ))}
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
