
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    Search, Plus, Undo2, FileUp, RefreshCw, 
    Archive, RotateCcw, LayoutGrid, List, X, ArrowRight, Trash2, Banknote, HandCoins, History, Filter, TrendingDown, Receipt, PackageCheck, AlertTriangle, ShieldX, Lock
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnTable } from '@/components/returns/ReturnTable';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import { DeleteMultipleReturnsDialog } from '@/components/returns/DeleteMultipleReturnsDialog';
import { ReturnReceipt } from '@/components/returns/ReturnReceipt';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { api } from '@/lib/api-client';
import { CsvImporter } from '@/lib/csv-utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * @fileOverview Returns Sovereign Ledger (Finalized with Granular Permission)
 */

const ITEMS_PER_PAGE = 12;

const StatCard = ({ title, value, icon: Icon, colorClass, desc, subValue }: { title: string, value: string, icon: any, colorClass: string, desc: string, subValue?: string }) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 opacity-50", colorClass)} />
        </CardHeader>
        <CardContent className="relative z-10">
            <div className={cn("text-2xl font-black tracking-tight", colorClass)}>{value}</div>
            <div className="flex items-center justify-between mt-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 italic">{desc}</p>
                {subValue && <span className="text-[10px] font-black text-foreground/40">{subValue}</span>}
            </div>
        </CardContent>
    </Card>
);

export default function ReturnsPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, viewMode } = useAppStore(state => ({
        profile: state.profile,
        viewMode: state.returnViewMode
    }));
    const { setReturnViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const [allReturns, setAllReturns] = useState<ProductReturn[] | undefined>(undefined);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [selectedReturnsUuids, setSelectedReturnsUuids] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    const isAllowed = profile?.permissions?.includes('returns') || isManagerOrAdmin;

    // Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Unité Retours Restreinte", { 
                description: "Vous ne possédez pas le décret nécessaire pour cette unité.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);

    const fetchReturnsAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange || !isAllowed) return;
        if (manual) setIsRefreshing(true);
        
        try {
            const query = new URLSearchParams({
                query: debouncedSearchQuery,
                from: dateRange.from?.toISOString() || '',
                to: dateRange.to?.toISOString() || ''
            }).toString();

            const [returnsData, customersData] = await Promise.all([
                api.get<ProductReturn[]>(`returns?${query}`),
                api.get<Customer[]>('customers')
            ]);
            setAllReturns(returnsData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
            setVisibleCount(ITEMS_PER_PAGE);
            setSelectedReturnsUuids(new Set());
        } catch (error: any) {
            toast.error("Impossible de charger les archives.");
            setAllReturns([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, isAllowed]);

    useEffect(() => {
        if (isAllowed) fetchReturnsAndCustomers();
    }, [fetchReturnsAndCustomers, isAllowed]);

    const stats = useMemo(() => {
        if (!allReturns) return { totalValue: 0, totalRefunded: 0, itemCount: 0, impactDebt: 0, restockedCount: 0 };
        return allReturns.reduce((acc, r) => {
            acc.totalValue += r.totalReturnValue;
            acc.totalRefunded += r.amountRefunded;
            acc.itemCount += r.items.length;
            acc.impactDebt += Math.max(0, r.totalReturnValue - r.amountRefunded);
            acc.restockedCount += r.items.filter(i => i.wasRestocked).length;
            return acc;
        }, { totalValue: 0, totalRefunded: 0, itemCount: 0, impactDebt: 0, restockedCount: 0 });
    }, [allReturns]);

    const visibleReturns = useMemo(() => {
        if (!allReturns) return [];
        return allReturns.slice(0, visibleCount);
    }, [allReturns, visibleCount]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedReturnsUuids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!allReturns) return;
        if (selectedReturnsUuids.size === visibleReturns.length) {
            setSelectedReturnsUuids(new Set());
        } else {
            setSelectedReturnsUuids(new Set(visibleReturns.map(r => r.uuid)));
        }
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

    const handleExport = () => {
        if (!allReturns?.length) return;
        CsvImporter.exportReturns(allReturns, customerMap);
        toast.success("Registre des retours exporté.");
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint à l'Unité Retours</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté des Retours" 
                description="Contrôle absolu des marchandises restituées و correction des balances financières."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={!allReturns?.length} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-primary/5">
                        <FileUp className="h-4 w-4" /> 
                        Exporter CSV
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-[0.2em] gap-3 hover:scale-105 active:scale-95 transition-all">
                        <Link href="/returns/new">
                            <Plus className="h-4 w-4" /> 
                            Nouveau Retour
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Valeur Marchande" value={formatCurrency(stats.totalValue)} icon={Undo2} colorClass="text-destructive" desc="Volume brut des retours" subValue={`${stats.itemCount} Un.`} />
                <StatCard title="Remboursements" value={formatCurrency(stats.totalRefunded)} icon={Banknote} colorClass="text-chart-quaternary" desc="Sorties de caisse réelles" />
                <StatCard title="Crédit Client" value={formatCurrency(stats.impactDebt)} icon={HandCoins} colorClass="text-primary" desc="Réduction des créances" />
                <StatCard title="Récupération" value={`${stats.restockedCount}`} icon={PackageCheck} colorClass="text-blue-400" desc="Articles réintégrés au stock" subValue={`${allReturns?.length || 0} Bons`} />
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par N° Facture..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10 shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <div className="flex items-center gap-1 rounded-xl bg-background/40 p-1 border border-white/10 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setReturnViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setReturnViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => fetchReturnsAndCustomers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedReturnsUuids.size > 0 && (
                <div className="flex justify-between items-center bg-destructive/5 border border-destructive/20 rounded-[1.5rem] p-4 animate-in slide-in-from-top-4 duration-500 shadow-xl">
                    <div className="flex items-center gap-4">
                        <Badge variant="destructive" className="px-4 py-1.5 rounded-xl font-black text-[10px] tracking-widest uppercase">
                            {selectedReturnsUuids.size} retour(s) sélectionné(s)
                        </Badge>
                        <p className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-60">Actions de masse</p>
                    </div>
                    {isManagerOrAdmin && (
                        <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6 shadow-lg shadow-destructive/20">
                            <Trash2 className="h-4 w-4" /> 
                            Annuler la Sélection
                        </Button>
                    )}
                </div>
            )}
            
            <div className="min-h-[500px]">
                {allReturns === undefined ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)}
                    </div>
                ) : allReturns.length === 0 ? (
                    <EmptyState icon={Undo2} title="Registre Vierge" description="Aucun retour n'est enregistré." className="py-32 luxury-glass border-white/5 bg-muted/5 rounded-[3rem]" />
                ) : (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-1000">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                                {visibleReturns.map(pr => {
                                    const customer = pr.customerUuid ? customerMap.get(pr.customerUuid) : null;
                                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                                    return (
                                        <ReturnHistoryCard 
                                            key={pr.uuid} 
                                            productReturn={pr}
                                            customerName={customerName}
                                            onViewDetails={handleViewDetails}
                                            onCancelReturn={handleCancelReturn}
                                            onPrint={handlePrint}
                                            isSelected={selectedReturnsUuids.has(pr.uuid)}
                                            onToggleSelection={() => handleToggleSelection(pr.uuid)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <ReturnTable 
                                returns={visibleReturns} 
                                customerMap={customerMap} 
                                onViewDetails={handleViewDetails} 
                                onCancelReturn={handleCancelReturn} 
                                onPrint={handlePrint} 
                                selectedReturns={selectedReturnsUuids}
                                onToggleSelection={handleToggleSelection}
                                onToggleAll={handleSelectAll}
                            />
                        )}
                        
                        {allReturns.length > visibleCount && (
                            <div className="flex justify-center pt-10 pb-20">
                                <Button variant="outline" onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)} className="min-w-[280px] h-16 rounded-[1.5rem] luxury-glass border-primary/20 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-primary/10 transition-all gap-4 group">
                                    Extraire plus d'archives ({visibleCount} / {allReturns.length})
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} onSuccess={() => fetchReturnsAndCustomers(true)} />
            {isManagerOrAdmin && (
                <DeleteMultipleReturnsDialog 
                    isOpen={isBulkDeleteOpen} 
                    onOpenChange={setIsBulkDeleteOpen} 
                    returnUuids={Array.from(selectedReturnsUuids)} 
                    onSuccess={() => { setSelectedReturnsUuids(new Set()); fetchReturnsAndCustomers(true); }} 
                />
            )}
            <div className="hidden">{selectedReturn && <ReturnReceipt ref={receiptRef} productReturn={selectedReturn} profile={profile} />}</div>
        </div>
    );
}
