
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Search, Plus, Undo2, FileUp, RefreshCw } from 'lucide-react';
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
import { api } from '@/lib/api-client';
import { CsvImporter } from '@/lib/csv-utils';

const ITEMS_PER_PAGE = 15;

export default function ReturnsPage() {
    const { viewMode } = useAppStore(state => ({
        viewMode: state.returnViewMode
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

    const receiptRef = useRef<HTMLDivElement>(null);

    const fetchReturnsAndCustomers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange) return;
        if (manual) setIsRefreshing(true);
        setAllReturns(undefined);
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
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Gestion des Retours" description="Historique des marchandises retournées.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={!allReturns?.length} className="border-primary/20"><FileUp className="mr-2 h-4 w-4" />Exporter CSV</Button>
                    <Button asChild className="bg-primary"><Link href="/returns/new"><Plus className="mr-2 h-4 w-4" /> Nouveau Retour</Link></Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="luxury-glass bg-destructive/5"><CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valeur Retours</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-destructive">{formatCurrency(stats.totalValue)}</p></CardContent></Card>
                <Card className="luxury-glass bg-chart-quaternary/5"><CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remboursements</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-chart-quaternary">{formatCurrency(stats.totalRefunded)}</p></CardContent></Card>
                <Card className="luxury-glass bg-primary/5"><CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Réduction Dette</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-primary">{formatCurrency(stats.impactDebt)}</p></CardContent></Card>
                <Card className="luxury-glass bg-secondary/5"><CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</CardTitle></CardHeader><CardContent><p className="text-2xl font-black">{allReturns?.length || 0}</p></CardContent></Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input placeholder="Rechercher..." className="w-full pl-10 h-11 luxury-glass rounded-xl text-sm outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    <Button variant="ghost" size="icon" onClick={() => fetchReturnsAndCustomers(true)} disabled={isRefreshing}><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /></Button>
                </div>
            </div>
            
            <div className="min-h-[400px]">
                {allReturns === undefined ? <div className="grid grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)}</div> : allReturns.length === 0 ? <EmptyState icon={Undo2} title="Aucun retour" description="Créez un nouveau retour pour régulariser un stock." /> : (
                    <div className="space-y-6">
                        {viewMode === 'grid' ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{visibleReturns.map(r => <ReturnHistoryCard key={r.uuid} productReturn={r} customerName={r.customerUuid ? `${customerMap.get(r.customerUuid)?.firstName} ${customerMap.get(r.customerUuid)?.lastName}` : 'Passage'} onViewDetails={handleViewDetails} onCancelReturn={handleCancelReturn} onPrint={(f) => handlePrint(r, f)} />)}</div> : <ReturnTable returns={visibleReturns} customerMap={customerMap} onViewDetails={handleViewDetails} onCancelReturn={handleCancelReturn} onPrint={(r, f) => handlePrint(r, f)} />}
                        {allReturns.length > visibleCount && <div className="flex justify-center pt-4"><Button variant="outline" onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)}>Charger plus</Button></div>}
                    </div>
                )}
            </div>

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} onSuccess={() => fetchReturnsAndCustomers(true)} />
            <div className="hidden">{selectedReturn && <ReturnReceipt ref={receiptRef} productReturn={selectedReturn} profile={profile} />}</div>
        </div>
    );
}
