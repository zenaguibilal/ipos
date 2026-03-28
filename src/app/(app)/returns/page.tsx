
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    Search, Plus, Undo2, FileUp, RefreshCw, 
    TrendingDown, Wallet, HandCoins, Archive, 
    History, ArrowRight, RotateCcw, Filter
} from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
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
import { api } from '@/lib/api-client';
import { CsvImporter } from '@/lib/csv-utils';
import { Input } from '@/components/ui/input';

/**
 * @fileOverview Returns Sovereign Ledger (Finalized Excellence)
 * المركز السيادي لتعقب حركات الإرجاع وتصحيح الأرصدة والمخزون.
 */

const ITEMS_PER_PAGE = 15;

const StatCard = ({ title, value, icon: Icon, colorClass, desc }: { title: string, value: string, icon: any, colorClass: string, desc: string }) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 opacity-50", colorClass)} />
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{desc}</p>
        </CardContent>
    </Card>
);

export default function ReturnsPage() {
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

    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchReturnsAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange) return;
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
        } catch (error: any) {
            toast.error("Impossible de charger les retours.");
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

    const handleReset = () => {
        setSearchQuery('');
        toast.info("Filtres réinitialisés.");
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté des Retours" 
                description="Régularisation des stocks و correction des balances clients après annulation."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={!allReturns?.length} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" /> 
                        Exporter CSV
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                        <Link href="/returns/new">
                            <Plus className="h-4 w-4" /> 
                            Nouveau Retour
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Valeur Retours" value={formatCurrency(stats.totalValue)} icon={Undo2} colorClass="text-destructive" desc="Pertes de revenus bruts" />
                <StatCard title="Remboursements" value={formatCurrency(stats.totalRefunded)} icon={Wallet} colorClass="text-chart-quaternary" desc="Sorties de caisse réelles" />
                <StatCard title="Correction Dettes" value={formatCurrency(stats.impactDebt)} icon={HandCoins} colorClass="text-primary" desc="Crédit sur comptes clients" />
                <StatCard title="Volume Flux" value={`${allReturns?.length || 0} Bons`} icon={Archive} colorClass="text-muted-foreground" desc="Opérations enregistrées" />
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par N° Facture ou Identité..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10 shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-destructive/10" onClick={handleReset} title="Réinitialiser">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => fetchReturnsAndCustomers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            <div className="min-h-[500px]">
                {allReturns === undefined ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-[2.5rem]" />)}
                    </div>
                ) : allReturns.length === 0 ? (
                    <EmptyState 
                        icon={Undo2} 
                        title="Aucun retour détecté" 
                        description={searchQuery ? "La recherche n'a retourné aucun flux." : "Le registre des retours est vierge. Commencez par régulariser une vente."} 
                        className="py-32 luxury-glass border-white/5 bg-muted/5"
                    >
                        {!searchQuery && (
                            <Button asChild className="rounded-2xl px-10 h-14 bg-primary shadow-2xl shadow-primary/20 font-black uppercase text-[11px] tracking-widest">
                                <Link href="/returns/new">Initialiser un retour</Link>
                            </Button>
                        )}
                    </EmptyState>
                ) : (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-1000">
                        <ReturnTable 
                            returns={visibleReturns} 
                            customerMap={customerMap} 
                            onViewDetails={handleViewDetails} 
                            onCancelReturn={handleCancelReturn} 
                            onPrint={handlePrint} 
                        />
                        
                        {allReturns.length > visibleCount && (
                            <div className="flex justify-center pt-10 pb-20">
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)}
                                    className="min-w-[240px] h-14 rounded-2xl luxury-glass border-primary/20 font-black uppercase text-[11px] tracking-widest hover:bg-primary/10 transition-all shadow-xl gap-3 group"
                                >
                                    Extraire plus d'archives
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} onSuccess={() => fetchReturnsAndCustomers(true)} />
            <div className="hidden">{selectedReturn && <ReturnReceipt ref={receiptRef} productReturn={selectedReturn} profile={profile} />}</div>
        </div>
    );
}
