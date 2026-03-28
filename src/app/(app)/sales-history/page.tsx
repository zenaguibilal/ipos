
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Search, History, FileUp, Filter, TrendingUp, ShoppingBag, 
    LayoutGrid, List, RefreshCw, Loader2, Wallet, HandCoins, 
    DollarSign, X, ArrowUpDown, Calendar, CalendarDays, CheckCircle2,
    AlertCircle, Clock, Receipt, Banknote, CreditCard, ChevronDown, 
    Target, Activity, TrendingUpDown, Zap, ArrowRight, Lock, Printer, ShieldX
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SalesHistoryTable } from '@/components/sales/SalesHistoryTable';
import { SalesHistoryTableSkeleton } from '@/components/sales/SalesHistoryTableSkeleton';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { PrintSaleReceiptDialog } from '@/components/sales/PrintSaleReceiptDialog';
import { PrintSaleListDialog } from '@/components/sales/PrintSaleListDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { CsvImporter } from '@/lib/csv-utils';
import { startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';

/**
 * @fileOverview Sales Sovereign Ledger (Finalized with Granular Permission)
 */

type PaymentFilter = 'all' | 'paid' | 'partial' | 'unpaid';
const ITEMS_PER_PAGE = 15;

const sortOptions = {
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
    'total_desc': 'Total (Plus élevé)',
    'total_asc': 'Total (Moins élevé)',
};

export default function SalesHistoryPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, viewMode } = useAppStore(state => ({
        profile: state.profile,
        viewMode: state.salesHistoryViewMode
    }));
    const { setSalesHistoryViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
    
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [allSales, setAllSales] = useState<Sale[] | undefined>(undefined);
    const [visibleSalesCount, setVisibleSalesCount] = useState(ITEMS_PER_PAGE);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const isAllowed = profile?.permissions?.includes('sales-history') || isManagerOrAdmin;

    // Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Unité Journal Restreinte", { 
                description: "L'audit des ventes nécessite une autorisation souveraine.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);

    const fetchSalesAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange || !isAllowed) return;
        if (manual) setIsRefreshing(true);
        
        try {
            const query = new URLSearchParams({
                query: debouncedSearchQuery,
                from: dateRange.from?.toISOString() || '',
                to: dateRange.to?.toISOString() || ''
            }).toString();

            const [salesData, customersData] = await Promise.all([
                api.get<Sale[]>(`sales?${query}`),
                api.get<Customer[]>('customers')
            ]);
            setAllSales(salesData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
            setVisibleSalesCount(ITEMS_PER_PAGE);
        } catch (error: any) {
            toast.error("Impossible de synchroniser le Grand Livre.");
            setAllSales([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, isAllowed]);

    useEffect(() => {
        if (isAllowed) fetchSalesAndCustomers();
    }, [fetchSalesAndCustomers, isAllowed]);

    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];
        
        let result = [...allSales];
        
        if (paymentFilter !== 'all') {
            result = result.filter(s => s.paymentStatus === paymentFilter);
        }

        const [field, order] = sortBy.split('_');
        const isAsc = order === 'asc';

        result.sort((a, b) => {
            if (field === 'createdAt') {
                const dateA = new Date(a.createdAt!).getTime();
                const dateB = new Date(b.createdAt!).getTime();
                return isAsc ? dateA - dateB : dateB - dateA;
            }
            if (field === 'total') {
                return isAsc ? a.total - b.total : b.total - a.total;
            }
            return 0;
        });

        return result;
    }, [allSales, paymentFilter, sortBy]);

    const visibleSales = useMemo(() => {
        return filteredAndSortedSales.slice(0, visibleSalesCount);
    }, [filteredAndSortedSales, visibleSalesCount]);

    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalCollected = 0;
        let totalDebt = 0;
        let totalCost = 0;
        let cashCollected = 0;
        let cardCollected = 0;
        const count = filteredAndSortedSales.length;

        filteredAndSortedSales.forEach(s => {
            totalRevenue += s.total;
            totalCollected += s.amountPaid;
            totalDebt += s.remainingBalance;
            
            s.payments?.forEach(p => {
                if (p.method === 'cash') cashCollected += p.amount;
                if (p.method === 'card') cardCollected += p.amount;
            });

            s.items?.forEach(item => {
                totalCost += (item.purchasePrice || 0) * item.quantity;
            });
        });

        const totalProfit = totalRevenue - totalCost;
        const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
        
        return { 
            totalRevenue, 
            totalCollected, 
            totalDebt, 
            count, 
            totalProfit,
            cashCollected,
            cardCollected,
            collectionRate
        };
    }, [filteredAndSortedSales]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };

    const handlePrintSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsPrintOpen(true);
    };

    const handleRecordPayment = (sale: Sale) => {
        if (!sale.customerUuid) {
            toast.error("Impossible d'encaisser un solde pour un passage.");
            return;
        }
        const customer = customerMap.get(sale.customerUuid);
        if (customer) {
            setCustomerForPayment(customer);
            setIsPaymentDialogOpen(true);
        }
    };

    const handleLoadMore = () => {
        setVisibleSalesCount(prev => prev + ITEMS_PER_PAGE);
    };

    const handleExport = () => {
        if (!filteredAndSortedSales.length) return;
        CsvImporter.exportSales(filteredAndSortedSales);
        toast.success("Registre exporté au format CSV.");
    };

    const resetFilters = () => {
        setSearchQuery('');
        setPaymentFilter('all');
        setSortBy('createdAt_desc');
    };

    if (!profile || !isAllowed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                <div className="p-6 bg-destructive/5 rounded-[3rem] border border-destructive/10 shadow-2xl relative overflow-hidden group">
                    <Lock className="h-16 w-16 text-destructive animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-destructive/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint au Journal</p>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, colorClass, sub, extra, restricted = false }: any) => (
        <Card className={cn(
            "luxury-glass border-white/5 bg-muted/10 group relative overflow-hidden transition-all duration-500 hover:border-primary/20",
            restricted && "opacity-60 grayscale cursor-not-allowed"
        )}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Icon className="h-24 w-24 rotate-12" />
            </div>
            <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 opacity-50", colorClass)} />
            </CardHeader>
            <CardContent className="p-6 relative z-10">
                {restricted ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                        <Lock className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Accès Souverain</span>
                    </div>
                ) : (
                    <>
                        <div className={cn("text-2xl font-black tracking-tighter", colorClass)}>{value}</div>
                        {sub && <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{sub}</p>}
                        {extra}
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader
                title="Grand Livre المبيعات"
                description="Suivi chronologique des flux de caisse, analyse des bénéfices و gestion des encaissements."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintSaleListDialog sales={filteredAndSortedSales} />
                    <Button variant="outline" onClick={handleExport} disabled={!allSales} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" />
                        Exporter CSV
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => fetchSalesAndCustomers(true)} disabled={isRefreshing} className="luxury-glass h-12 w-12 rounded-2xl border-white/5 hover:bg-primary/10">
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Volume Recettes" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} colorClass="text-primary" sub={`${stats.count} opérations`} />
                <StatCard title="Liquidités & Flux" value={formatCurrency(stats.totalCollected)} icon={Wallet} colorClass="text-chart-quaternary" extra={
                    <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] h-4 bg-chart-quaternary/5 border-chart-quaternary/20 text-chart-quaternary">💵 {formatCurrency(stats.cashCollected)}</Badge>
                        <Badge variant="outline" className="text-[8px] h-4 bg-blue-500/5 border-blue-500/20 text-blue-400">💳 {formatCurrency(stats.cardCollected)}</Badge>
                    </div>
                } />
                <StatCard title="Créances Clients" value={formatCurrency(stats.totalDebt)} icon={HandCoins} colorClass="text-destructive" sub="Restant à percevoir" restricted={!isManagerOrAdmin} />
                <StatCard title="Bénéfice Brut" value={formatCurrency(stats.totalProfit)} icon={DollarSign} colorClass="text-chart-secondary" sub="Marge sur achat" restricted={!isManagerOrAdmin} />
                <StatCard title="Indice de Recouvrement" value={`${Math.round(stats.collectionRate)}%`} icon={CheckCircle2} colorClass="text-blue-400" extra={
                    <div className="mt-3 space-y-1.5">
                        <Progress value={stats.collectionRate} className="h-1.5 bg-white/10 [&>div]:bg-blue-400" />
                    </div>
                } />
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="N° Facture ou Identité Client..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10 shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[140px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-primary" />
                                    {paymentFilter === 'all' ? 'Tous statuts' : paymentFilter === 'paid' ? 'Payé' : paymentFilter === 'partial' ? 'Partiel' : 'Impayé'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[200px] p-2">
                            <DropdownMenuRadioGroup value={paymentFilter} onValueChange={(val) => setPaymentFilter(val as PaymentFilter)}>
                                <DropdownMenuRadioItem value="all" className="font-bold py-2.5 rounded-lg">Toutes les ventes</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="paid" className="font-bold py-2.5 rounded-lg text-chart-quaternary">Réglées</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="unpaid" className="font-bold py-2.5 rounded-lg text-destructive">À crédit</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSalesHistoryViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSalesHistoryViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-destructive/10" onClick={resetFilters} title="Réinitialiser">
                        <History className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>
            
            <div className="min-h-[500px]">
               {allSales === undefined ? (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-[2.5rem]" />)}
                       </div>
                   ) : <SalesHistoryTableSkeleton />
               ) : filteredAndSortedSales.length === 0 ? (
                   <EmptyState icon={History} title="Aucun flux détecté" description="La recherche n'a retourné aucun résultat." className="py-32 luxury-glass border-white/5 bg-muted/5" />
               ) : (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-1000">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                                {visibleSales.map(s => {
                                    const customer = s.customerUuid ? customerMap.get(s.customerUuid) : undefined;
                                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                                    return (
                                        <SalesHistoryCard 
                                            key={s.uuid} 
                                            sale={s}
                                            customerName={customerName}
                                            onViewDetails={handleViewDetails}
                                            onCancelSale={handleCancelSale}
                                            onPrint={handlePrintSale}
                                            onRecordPayment={s.remainingBalance > 0 ? () => handleRecordPayment(s) : undefined}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <SalesHistoryTable 
                                sales={visibleSales}
                                customerMap={customerMap}
                                onViewDetails={handleViewDetails}
                                onCancelSale={handleCancelSale}
                                onPrint={handlePrintSale}
                                onRecordPayment={handleRecordPayment}
                            />
                        )}

                        {visibleSalesCount < filteredAndSortedSales.length && (
                            <div className="flex justify-center pt-10 pb-20">
                                <Button 
                                    variant="outline" 
                                    onClick={handleLoadMore} 
                                    className="min-w-[240px] h-14 rounded-2xl luxury-glass border-primary/20 font-black uppercase text-[11px] tracking-widest hover:bg-primary/10 transition-all gap-3 group"
                                >
                                    Extraire plus d'archives ({visibleSales.length} / {filteredAndSortedSales.length})
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        )}
                   </div>
               )}
            </div>

            {selectedSale && (
                <>
                    <SaleDetailsDialog 
                        isOpen={isDetailsOpen}
                        onOpenChange={setIsDetailsOpen}
                        sale={selectedSale}
                        customerName={selectedSale.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : 'Compte Inconnu') : 'Client de passage'}
                        onPrint={() => {
                            setIsDetailsOpen(false);
                            setIsPrintOpen(true);
                        }}
                        onRecordPayment={selectedSale.remainingBalance > 0 ? () => handleRecordPayment(selectedSale) : undefined}
                    />
                    <CancelSaleDialog 
                        isOpen={isCancelOpen}
                        onOpenChange={setIsCancelOpen}
                        sale={selectedSale}
                        onSuccess={() => fetchSalesAndCustomers(true)}
                    />
                    <PrintSaleReceiptDialog
                        isOpen={isPrintOpen}
                        onOpenChange={setIsPrintOpen}
                        sale={selectedSale}
                        customer={selectedSale.customerUuid ? customerMap.get(selectedSale.customerUuid) || null : null}
                    />
                </>
            )}

            {customerForPayment && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customerForPayment}
                    onPaymentSuccess={() => {
                        setIsPaymentDialogOpen(false);
                        fetchSalesAndCustomers(true);
                    }}
                />
            )}
        </div>
    );
}
