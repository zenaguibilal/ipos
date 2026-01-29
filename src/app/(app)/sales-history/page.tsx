
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc, runTransaction } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, CreditCard, HandCoins, CircleDollarSign, Download, ChevronDown, TrendingUp, MoreHorizontal, Trash2, FileText, MessageSquare, BellRing } from 'lucide-react';
import type { Sale, Payment, CompanyProfile, Customer } from '@/lib/types';
import { cn, safeToDate } from '@/lib/utils';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { A4Receipt } from '@/components/sales/a4-receipt';
import html2canvas from 'html2canvas';
import { TransactionCard } from '@/components/sales/transaction-card';
import { TransactionCardSkeleton } from '@/components/sales/transaction-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';


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
    const [saleForShare, setSaleForShare] = useState<Sale | null>(null);
    const a4ReceiptRef = useRef<HTMLDivElement>(null);


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

    useEffect(() => {
        const savedFilter = localStorage.getItem('sales_history_status_filter') as StatusFilter;
        if (savedFilter) {
            setStatusFilter(savedFilter);
        }
    }, []);

    const handleFilterChange = (value: StatusFilter) => {
        setStatusFilter(value);
        localStorage.setItem('sales_history_status_filter', value);
    };

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

    const { groupedTransactions, totalRevenue, totalCollected, totalProfit } = useMemo(() => {
        if (!combinedTransactions) {
            return { groupedTransactions: {}, totalRevenue: 0, totalCollected: 0, totalProfit: 0 };
        }

        const fromDate = dateRange?.from;
        const toDate = dateRange?.to;

        const initialStats = {
            groupedTransactions: {} as Record<string, { transactions: Transaction[], dailyRevenue: number, dailyCollected: number, dailyProfit: number }>,
            totalRevenue: 0,
            totalCollected: 0,
            totalProfit: 0,
        };

        const finalStats = combinedTransactions.reduce((acc, transaction) => {
            if (!transaction.data.createdAt) return acc;
            
            const transactionDate = safeToDate(transaction.data.createdAt);
            if (fromDate && transactionDate < fromDate) return acc;
            if (toDate && transactionDate > toDate) return acc;

            const matchesSearch = searchQuery 
                ? (transaction.data.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  ('invoiceNumber' in transaction.data && transaction.data.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())))
                : true;
            if (!matchesSearch) return acc;

            let statusMatch = false;
            switch (statusFilter) {
                case 'all':
                    statusMatch = true;
                    break;
                case 'paid':
                    statusMatch = transaction.type === 'sale' && transaction.data.paymentStatus === 'paid';
                    break;
                case 'unpaid':
                     statusMatch = transaction.type === 'sale' && (transaction.data.paymentStatus === 'unpaid' || transaction.data.paymentStatus === 'partial');
                    break;
                case 'payments':
                    statusMatch = transaction.type === 'payment';
                    break;
                default:
                    statusMatch = true;
            }
            if (!statusMatch) return acc;

            // Grouping Logic
            const dateStr = format(transactionDate, 'yyyy-MM-dd');
            if (!acc.groupedTransactions[dateStr]) {
                acc.groupedTransactions[dateStr] = { transactions: [], dailyRevenue: 0, dailyCollected: 0, dailyProfit: 0 };
            }
            acc.groupedTransactions[dateStr].transactions.push(transaction);

            // Calculation Logic
            if (transaction.type === 'sale') {
                const sale = transaction.data;
                const saleProfit = sale.items.reduce((profit, item) => {
                    const purchasePrice = typeof item.purchasePrice === 'number' ? item.purchasePrice : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
                    return profit + (item.price - purchasePrice) * quantity;
                }, 0);

                acc.groupedTransactions[dateStr].dailyRevenue += sale.total;
                acc.groupedTransactions[dateStr].dailyCollected += sale.amountPaid;
                acc.groupedTransactions[dateStr].dailyProfit += saleProfit;
                acc.totalRevenue += sale.total;
                acc.totalCollected += sale.amountPaid;
                acc.totalProfit += saleProfit;
            } else { // Payment
                const payment = transaction.data;
                acc.groupedTransactions[dateStr].dailyCollected += payment.amount;
                acc.totalCollected += payment.amount;
            }

            return acc;
        }, initialStats);
        
        return finalStats;

    }, [combinedTransactions, searchQuery, statusFilter, dateRange]);

    const customersMap = useMemo(() => {
        if (!customers) return new Map<string, Customer>();
        return new Map(customers.map(c => [c.id, c]));
    }, [customers]);

    const selectedCustomer = useMemo(() => {
        if (!selectedSale?.customerId) return null;
        return customersMap.get(selectedSale.customerId) || null;
    }, [selectedSale, customersMap]);

    const customerForShare = useMemo(() => {
        if (!saleForShare?.customerId) return null;
        return customersMap.get(saleForShare.customerId) || null;
    }, [saleForShare, customersMap]);


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

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete || !firestore || !user) return;
    
        const { type, data } = transactionToDelete;
    
        if (type === 'payment') {
            const docRef = doc(firestore, 'users', user.uid, 'payments', data.id);
            deleteDocumentNonBlocking(docRef, {
                onSuccess: () => {
                    toast.success(`Le paiement a été supprimé.`);
                    setTransactionToDelete(null);
                },
                onError: (err) => {
                    toast.error("Erreur lors de la suppression du paiement.");
                    console.error(err);
                    setTransactionToDelete(null);
                }
            });
            return;
        }
    
        if (type === 'sale') {
            const saleToDelete = data as Sale;
            toast.info("Annulation de la vente en cours... Le stock est en cours de restauration.");
    
            try {
                await runTransaction(firestore, async (transaction) => {
                    const saleRef = doc(firestore, 'users', user.uid, 'sales', saleToDelete.id);
                    
                    for (const item of saleToDelete.items) {
                        if (item.id && !item.id.startsWith('custom-')) {
                            const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                            const productDoc = await transaction.get(productRef);
                            if (productDoc.exists()) {
                                const currentQuantity = productDoc.data().quantity;
                                transaction.update(productRef, {
                                    quantity: currentQuantity + item.quantity
                                });
                            }
                        }
                    }
                    
                    transaction.delete(saleRef);
                });
    
                toast.success("Vente annulée et stock restauré.");
            } catch (error) {
                console.error("Failed to delete sale and restock:", error);
                toast.error("Échec de l'annulation de la vente. Le stock n'a pas été modifié.");
            } finally {
                setTransactionToDelete(null);
            }
        }
    };

    const handleShareReceiptAsImage = async (sale: Sale, isReminder: boolean) => {
        setSaleForShare(sale);
    
        // Wait for state to update and component to render
        await new Promise(resolve => setTimeout(resolve, 100));
    
        const element = a4ReceiptRef.current;
        const customer = sale.customerId ? customersMap.get(sale.customerId) : null;
    
        if (!element || !customer) {
            toast.error("Erreur: Impossible de générer l'image de la facture.");
            setSaleForShare(null);
            return;
        }
    
        toast.info("Génération de l'image de la facture en cours...");
    
        try {
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });
            
            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) {
                    toast.error("Erreur lors de la création de l'image.");
                    setSaleForShare(null);
                    return;
                }
    
                const fileName = `facture-${sale.invoiceNumber}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
    
                const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
                const shareText = isReminder
                    ? `Bonjour ${customerName}. Un petit rappel concernant votre facture N°${sale.invoiceNumber}. Le solde restant est de ${sale.remainingBalance.toFixed(1)} DA. Merci de votre attention.`
                    : `Bonjour ${customerName}. Ci-joint votre facture N°${sale.invoiceNumber}. Total: ${sale.total.toFixed(1)} DA, Payé: ${sale.amountPaid.toFixed(1)} DA, Solde: ${sale.remainingBalance.toFixed(1)} DA.`;
    
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: `Facture ${sale.invoiceNumber}`,
                            text: shareText,
                            files: [file],
                        });
                        toast.success("Facture partagée !");
                    } catch (error: any) {
                        if (error.name !== 'AbortError') {
                            console.error('Share failed:', error);
                            toast.error("Le partage a échoué.");
                        }
                    }
                } else {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("L'image de la facture a été téléchargée. Vous pouvez maintenant la partager manuellement.", {
                        description: "La plupart des navigateurs mobiles prennent en charge le partage direct."
                    });
                }
    
                setSaleForShare(null);
    
            }, 'image/png');
    
        } catch (error) {
            console.error("html2canvas error:", error);
            toast.error("Une erreur est survenue lors de la génération de l'image.");
            setSaleForShare(null);
        }
    };

    const handleSendReceipt = (sale: Sale) => {
        const customer = sale.customerId ? customersMap.get(sale.customerId) : null;
        if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone de ce client n'est pas disponible.");
            return;
        }
        handleShareReceiptAsImage(sale, false);
    };

    const handleSendReminder = (sale: Sale) => {
        const customer = sale.customerId ? customersMap.get(sale.customerId) : null;
        if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone de ce client n'est pas disponible pour un rappel.");
            return;
        }
        handleShareReceiptAsImage(sale, true);
    };


    const isLoading = isUserLoading || isLoadingSales || isLoadingPayments || isLoadingCompany || isLoadingCustomers;

    if (!user && !isLoading) {
        return null;
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
                                Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible et affectera les soldes des clients et les rapports. Pour les ventes, le stock sera restauré.
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
             {saleForShare && (
                <div className="hidden print-hide">
                    <div ref={a4ReceiptRef}>
                        <A4Receipt sale={saleForShare} companyProfile={companyProfile} customer={customerForShare} />
                    </div>
                </div>
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
                                <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => handleFilterChange('all')}>Tout</Button>
                                <Button variant={statusFilter === 'paid' ? 'default' : 'ghost'} size="sm" onClick={() => handleFilterChange('paid')}>Payé</Button>
                                <Button variant={statusFilter === 'unpaid' ? 'default' : 'ghost'} size="sm" onClick={() => handleFilterChange('unpaid')}>Impayé/Partiel</Button>
                                <Button variant={statusFilter === 'payments' ? 'default' : 'ghost'} size="sm" onClick={() => handleFilterChange('payments')}>Paiements</Button>
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
                        {isLoading ? (
                             <div className="space-y-8">
                                <div className="space-y-4">
                                    <Skeleton className="h-7 w-48" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {Array.from({ length: 4 }).map((_, i) => <TransactionCardSkeleton key={i} />)}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-7 w-48" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {Array.from({ length: 3 }).map((_, i) => <TransactionCardSkeleton key={i} />)}
                                    </div>
                                </div>
                            </div>
                        ) : Object.keys(groupedTransactions).length === 0 ? (
                             <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {combinedTransactions.length > 0 ? "Aucune transaction ne correspond à votre recherche." : "Aucune transaction enregistrée pour le moment."}
                                </p>
                            </div>
                        ) : (
                             <div className="space-y-8">
                                {Object.entries(groupedTransactions).map(([dateStr, group]) => (
                                    <div key={dateStr}>
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">{format(new Date(dateStr + 'T12:00:00'), 'eeee d MMMM yyyy', { locale: fr })}</h3>
                                            <div className="text-xs flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                                                 <span>Bénéfice: <span className="font-bold text-green-600">{group.dailyProfit.toFixed(1)} DA</span></span>
                                                 <span>C.A.: <span className="font-bold">{group.dailyRevenue.toFixed(1)} DA</span></span>
                                                 <span>Encaissé: <span className="font-bold text-green-600">{group.dailyCollected.toFixed(1)} DA</span></span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {group.transactions.map((transaction, index) => {
                                                const customerForSale = transaction.type === 'sale' && transaction.data.customerId
                                                    ? customersMap.get(transaction.data.customerId)
                                                    : null;
                                                return (
                                                    <TransactionCard
                                                        key={`${transaction.type}-${transaction.data.id}-${index}`}
                                                        transaction={transaction}
                                                        customerForSale={customerForSale}
                                                        onViewDetails={setSelectedSale}
                                                        onSendReceipt={handleSendReceipt}
                                                        onSendReminder={handleSendReminder}
                                                        onDelete={setTransactionToDelete}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
