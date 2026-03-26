
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History, FileUp, Filter, TrendingUp, Receipt as ReceiptIcon, ShoppingBag, LayoutGrid, List, SortAsc, RefreshCw, Loader2 } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SalesHistoryTable } from '@/components/sales/SalesHistoryTable';
import { SalesHistoryTableSkeleton } from '@/components/sales/SalesHistoryTableSkeleton';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { PrintSaleReceiptDialog } from '@/components/sales/PrintSaleReceiptDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

type PaymentFilter = 'all' | 'paid' | 'partial' | 'unpaid';

const sortOptions: { [key: string]: string } = {
    'createdAt_desc': 'Plus récentes',
    'createdAt_asc': 'Plus anciennes',
    'total_desc': 'Montant (Élevé)',
    'total_asc': 'Montant (Bas)',
};

const ITEMS_PER_PAGE = 15;

export default function SalesHistoryPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.salesHistoryViewMode,
        setViewMode: state.actions.setSalesHistoryViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [allSales, setAllSales] = useState<Sale[] | undefined>(undefined);
    const [visibleSalesCount, setVisibleSalesCount] = useState(ITEMS_PER_PAGE);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isExporting, setIsExporting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSalesAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange) return;
        if (manual) setIsRefreshing(true);
        setAllSales(undefined);
        try {
            const [salesData, customersData] = await Promise.all([
                salesService.filterSales({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                customerService.getCustomers()
            ]);
            setAllSales(salesData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
            setVisibleSalesCount(ITEMS_PER_PAGE);
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des ventes.", { description: error.message });
            setAllSales([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchSalesAndCustomers();
    }, [fetchSalesAndCustomers]);

    const filteredAndSortedSales = useMemo(() => {
        if (!allSales) return [];
        
        let result = [...allSales];
        
        // Payment Filter
        if (paymentFilter !== 'all') {
            result = result.filter(s => s.paymentStatus === paymentFilter);
        }

        // Sorting
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
        const totalRevenue = filteredAndSortedSales.reduce((sum, s) => sum + s.total, 0);
        const count = filteredAndSortedSales.length;
        const avgBasket = count > 0 ? totalRevenue / count : 0;
        return { totalRevenue, count, avgBasket };
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

    const handleLoadMore = () => {
        setVisibleSalesCount(prev => prev + ITEMS_PER_PAGE);
    };

    const handleExport = async () => {
        if (!filteredAndSortedSales.length) {
            toast.info("Aucune vente à exporter.");
            return;
        }
        setIsExporting(true);
        try {
            await salesService.exportToCSV(filteredAndSortedSales, customerMap);
            toast.success("Historique exporté avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de l'exportation.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const renderSkeletons = () => (
        viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
            </div>
        ) : <SalesHistoryTableSkeleton />
    );

    const renderContent = () => {
        if (allSales === undefined) {
            return renderSkeletons();
        }

        if (filteredAndSortedSales.length === 0) {
            return (
                <EmptyState
                    icon={History}
                    title="Aucune vente trouvée"
                    description="Essayez d'ajuster votre recherche ou vos filtres de période."
                />
            );
        }
        
        return (
            <div className="space-y-6">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    />
                )}

                {visibleSalesCount < filteredAndSortedSales.length && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" size="lg" onClick={handleLoadMore} className="min-w-[200px]">
                            Charger plus ({visibleSales.length} / {filteredAndSortedSales.length})
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Historique des Ventes"
                description="Consultez et gérez vos transactions passées."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={allSales === undefined || isExporting}>
                        <FileUp className={cn("mr-2 h-4 w-4", isExporting && "animate-pulse")} />
                        Exporter CSV
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => fetchSalesAndCustomers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Recettes Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-primary">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Sur la période filtrée</p>
                    </CardContent>
                </Card>
                <Card className="bg-chart-quaternary/5 border-chart-quaternary/20">
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <ReceiptIcon className="h-4 w-4 text-chart-quaternary" />
                            Nombre de Ventes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-chart-quaternary">{stats.count}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Transactions validées</p>
                    </CardContent>
                </Card>
                <Card className="bg-chart-secondary/5 border-chart-secondary/20">
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-chart-secondary" />
                            Panier Moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-chart-secondary">{formatCurrency(stats.avgBasket)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Valeur moyenne par ticket</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par N° Facture ou Nom Client..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Filter className="mr-2 h-4 w-4" />
                                Statut: {paymentFilter === 'all' ? 'Tous' : paymentFilter === 'paid' ? 'Payé' : paymentFilter === 'partial' ? 'Partiel' : 'Impayé'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filtrer par paiement</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={paymentFilter === 'all'} onCheckedChange={() => setPaymentFilter('all')}>Tout afficher</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={paymentFilter === 'paid'} onCheckedChange={() => setPaymentFilter('paid')}>Payées uniquement</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={paymentFilter === 'partial'} onCheckedChange={() => setPaymentFilter('partial')}>Partielles uniquement</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={paymentFilter === 'unpaid'} onCheckedChange={() => setPaymentFilter('unpaid')}>Impayées uniquement</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <SortAsc className="mr-2 h-4 w-4" />
                                Trier: {sortOptions[sortBy]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Trier les ventes par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')} title="Vue Grille">
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')} title="Vue Liste">
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="min-h-[400px]">
               {renderContent()}
            </div>

            {selectedSale && (
                <>
                    <SaleDetailsDialog 
                        isOpen={isDetailsOpen}
                        onOpenChange={setIsDetailsOpen}
                        sale={selectedSale}
                        customerName={selectedSale.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : 'Client Inconnu') : 'Client de passage'}
                        onPrint={() => {
                            setIsDetailsOpen(false);
                            setIsPrintOpen(true);
                        }}
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
        </div>
    );
}
