
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { returnService } from '@/services/return.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Undo2, LayoutGrid, List, FileUp, RefreshCw, Loader2, Banknote, Package, HandCoins, X, TrendingDown, Printer, Filter } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnTable } from '@/components/returns/ReturnTable';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import { ReturnReceipt } from '@/components/returns/ReturnReceipt';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const ITEMS_PER_PAGE = 12;

export default function ReturnsPage() {
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.returnViewMode,
        setViewMode: state.actions.setReturnViewMode,
    }));
    const profile = useAppStore(state => state.profile);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [allReturns, setAllReturns] = useState<ProductReturn[] | undefined>(undefined);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchReturnsAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange) return;
        if (manual) setIsRefreshing(true);
        setAllReturns(undefined);
        try {
            const [returnsData, customersData] = await Promise.all([
                returnService.filterReturns({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                customerService.getCustomers()
            ]);
            setAllReturns(returnsData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
            setVisibleCount(ITEMS_PER_PAGE);
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des retours.", { description: error.message });
            setAllReturns([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchReturnsAndCustomers();
    }, [fetchReturnsAndCustomers]);

    const stats = useMemo(() => {
        if (!allReturns) return { totalValue: 0, totalRefunded: 0, itemCount: 0, impactDebt: 0 };
        
        return allReturns.reduce((acc, r) => {
            acc.totalValue += r.totalReturnValue;
            acc.totalRefunded += r.amountRefunded;
            acc.itemCount += r.items.length;
            acc.impactDebt += (r.totalReturnValue - r.amountRefunded);
            return acc;
        }, { totalValue: 0, totalRefunded: 0, itemCount: 0, impactDebt: 0 });
    }, [allReturns]);

    const visibleReturns = useMemo(() => {
        if (!allReturns) return [];
        return allReturns.slice(0, visibleCount);
    }, [allReturns, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };

    const handleViewDetails = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsDetailsOpen(true);
    };

    const handleCancelReturn = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsCancelOpen(true);
    };

    const handlePrint = (pr: ProductReturn, format: 'thermal' | 'a4') => {
        setSelectedReturn(pr);
        // Wait for state to update and print
        setTimeout(() => {
            const printableContent = document.getElementById('receipt-for-print');
            const receiptElement = receiptRef.current;

            if (!printableContent || !receiptElement) return;

            const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
            
            document.documentElement.classList.toggle('thermal', format === 'thermal');
            receiptClone.classList.add(format === 'thermal' ? 'thermal-receipt' : 'a4-receipt');

            printableContent.innerHTML = '';
            printableContent.appendChild(receiptClone);

            setTimeout(() => {
                window.print();
                document.documentElement.classList.remove('thermal');
            }, 100);
        }, 50);
    };

    const handleExport = async () => {
        if (!allReturns || allReturns.length === 0) {
            toast.info("Aucun retour à exporter.");
            return;
        }
        setIsExporting(true);
        try {
            await returnService.exportToCSV(allReturns, customerMap);
            toast.success("Historique des retours exporté avec succès.");
        } catch (error) {
            toast.error("Erreur lors de l'exportation.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)}
        </div>
    );

    const renderContent = () => {
        if (allReturns === undefined) {
            return renderSkeletons();
        }

        if (allReturns.length === 0) {
            return (
                <EmptyState
                    icon={Undo2}
                    title="Aucun retour de produit trouvé"
                    description="Ajustez vos filtres ou créez un nouveau retour pour régulariser un stock ou une dette."
                >
                     <Button asChild className="luxury-glass bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary">
                        <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                    </Button>
                </EmptyState>
            );
        }
        
        return (
            <div className="space-y-6">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleReturns.map(r => {
                            const customer = r.customerUuid ? customerMap.get(r.customerUuid) : undefined;
                            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                            return (
                                <ReturnHistoryCard 
                                    key={r.uuid} 
                                    productReturn={r}
                                    customerName={customerName}
                                    onViewDetails={handleViewDetails}
                                    onCancelReturn={handleCancelReturn}
                                    onPrint={(format) => handlePrint(r, format)}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <ReturnTable 
                        returns={visibleReturns}
                        customerMap={customerMap}
                        onViewDetails={handleViewDetails}
                        onCancelReturn={handleCancelReturn}
                        onPrint={(r, format) => handlePrint(r, format)}
                    />
                )}

                {allReturns.length > visibleCount && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" size="lg" onClick={handleLoadMore} className="min-w-[200px] luxury-glass border-primary/20">
                            Charger plus ({visibleReturns.length} / {allReturns.length})
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Retours"
                description="Historique des marchandises retournées et impact sur les soldes clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={!allReturns?.length || isExporting} className="border-primary/20 luxury-glass">
                        <FileUp className={cn("mr-2 h-4 w-4", isExporting && "animate-pulse")} />
                        Exporter CSV
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Dashboard des Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="luxury-glass bg-destructive/5 border-destructive/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-12 w-12 text-destructive" />
                    </div>
                    <CardHeader className="py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Retours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-destructive">{formatCurrency(stats.totalValue)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{stats.itemCount} articles au total</p>
                    </CardContent>
                </Card>

                <Card className="luxury-glass bg-chart-quaternary/5 border-chart-quaternary/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Banknote className="h-12 w-12 text-chart-quaternary" />
                    </div>
                    <CardHeader className="py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remboursements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-chart-quaternary">{formatCurrency(stats.totalRefunded)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Argent rendu aux clients</p>
                    </CardContent>
                </Card>

                <Card className="luxury-glass bg-primary/5 border-primary/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <HandCoins className="h-12 w-12 text-primary" />
                    </div>
                    <CardHeader className="py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Réduction Dette</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-primary">{formatCurrency(stats.impactDebt)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Crédits portés aux comptes</p>
                    </CardContent>
                </Card>

                <Card className="luxury-glass bg-secondary/5 border-border/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardHeader className="py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black">{allReturns?.length || 0}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Opérations enregistrées</p>
                    </CardContent>
                </Card>
            </div>

            {/* Barre d'outils */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        placeholder="N° Facture originale ou Nom du client..."
                        className="w-full pl-10 pr-10 h-11 border-primary/10 bg-background/50 focus:border-primary/30 luxury-glass rounded-xl text-sm outline-none"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('grid')} title="Vue Grille">
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('list')} title="Vue Liste">
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-primary/10 rounded-xl luxury-glass" onClick={() => fetchReturnsAndCustomers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            <div className="min-h-[400px]">
                {renderContent()}
            </div>

            <ReturnDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                productReturn={selectedReturn}
            />
            <CancelReturnDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                productReturn={selectedReturn}
                onSuccess={() => fetchReturnsAndCustomers(true)}
            />

            {/* Hidden printable receipt */}
            <div className="hidden">
                {selectedReturn && <ReturnReceipt ref={receiptRef} productReturn={selectedReturn} profile={profile} />}
            </div>
        </div>
    );
}
