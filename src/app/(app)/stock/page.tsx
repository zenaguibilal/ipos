
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, RefreshCw, ShieldAlert } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeTableSkeleton } from '@/components/stock/stock-intake-table-skeleton';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { CancelIntakeDialog } from '@/components/stock/CancelIntakeDialog';
import { StockIntakeStats } from '@/components/stock/StockIntakeStats';
import { cn } from '@/lib/utils';

export default function StockPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, viewMode } = useAppStore(state => ({
        profile: state.profile,
        viewMode: state.stockViewMode,
    }));
    const { setStockViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [stockIntakes, setStockIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [supplierMap, setSupplierMap] = useState<Map<string, Supplier>>(new Map());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Role Guard
    useEffect(() => {
        if (profile && !isManagerOrAdmin) {
            toast.error("Accès restreint", { description: "Seuls les gérants peuvent consulter l'historique des réceptions." });
            router.replace('/sell');
        }
    }, [profile, isManagerOrAdmin, router]);

    const fetchStockIntakesAndSuppliers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange?.from || !isManagerOrAdmin) return;
        if (manual) setIsRefreshing(true);
        setStockIntakes(undefined);
        try {
            const query = new URLSearchParams({
                query: debouncedSearchQuery,
                from: dateRange.from?.toISOString() || '',
                to: dateRange.to?.toISOString() || ''
            }).toString();

            const [intakesData, suppliersData] = await Promise.all([
                api.get<StockIntake[]>(`stock?${query}`),
                api.get<Supplier[]>('suppliers')
            ]);

            setStockIntakes(intakesData);
            setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des réceptions.");
            setStockIntakes([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, isManagerOrAdmin]);

    useEffect(() => {
        fetchStockIntakesAndSuppliers();
    }, [fetchStockIntakesAndSuppliers]);

    const handleViewDetails = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    }, []);

    const handleCancelIntake = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsCancelOpen(true);
    }, []);

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-black uppercase italic">Vérification des Décrets...</h2>
            </div>
        );
    }

    const isLoading = stockIntakes === undefined;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Historique des Réceptions"
                description="Consultez toutes les réceptions de marchandises et frais de transport."
            >
                <Button asChild>
                    <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                </Button>
            </PageHeader>

            <StockIntakeStats intakes={stockIntakes} isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par Fournisseur ou N° Facture..."
                        className="pl-10 luxury-glass rounded-xl h-11"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <DateRangePicker date={dateRange} setDate={setDate} />
                <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setStockViewMode('grid')}>
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setStockViewMode('list')}>
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-11 w-11 luxury-glass" onClick={() => fetchStockIntakesAndSuppliers(true)} disabled={isRefreshing}>
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
            </div>
            
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
                    </div>
                ) : stockIntakes?.length === 0 ? (
                    <EmptyState
                        icon={Archive}
                        title="Aucune réception de stock"
                        description="Commencez par enregistrer une nouvelle réception de marchandise."
                    >
                         <Button asChild>
                            <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                        </Button>
                    </EmptyState>
                ) : (
                    viewMode === 'list' ? (
                        <StockIntakeTable
                            intakes={stockIntakes!}
                            supplierMap={supplierMap}
                            onViewDetails={handleViewDetails}
                            onCancelIntake={handleCancelIntake}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stockIntakes?.map(s => (
                                <StockIntakeCard 
                                    key={s.uuid} 
                                    intake={s}
                                    supplierName={s.supplierUuid ? supplierMap.get(s.supplierUuid)?.name : undefined}
                                    onViewDetails={handleViewDetails}
                                    onCancelIntake={handleCancelIntake}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            <StockIntakeDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                intake={selectedIntake}
                supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Fournisseur Inconnu'}
            />

            <CancelIntakeDialog
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                intake={selectedIntake}
                onSuccess={() => fetchStockIntakesAndSuppliers(true)}
            />
        </div>
    );
}
