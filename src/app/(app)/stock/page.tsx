'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List } from 'lucide-react';
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
import { stockService } from '@/services/stock.service';
import { supplierService } from '@/services/supplier.service';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { CancelIntakeDialog } from '@/components/stock/CancelIntakeDialog';
import { StockIntakeStats } from '@/components/stock/StockIntakeStats';

export default function StockPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.stockViewMode,
        setViewMode: state.actions.setStockViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [stockIntakes, setStockIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [supplierMap, setSupplierMap] = useState<Map<string, Supplier>>(new Map());
    const isLoading = stockIntakes === undefined;

    const fetchStockIntakesAndSuppliers = useCallback(async () => {
        if (!isMounted || !dateRange?.from) return;
        setStockIntakes(undefined);
        try {
            const [intakesData, suppliersData] = await Promise.all([
                stockService.getStockIntakes({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                supplierService.getSuppliers()
            ]);

            setStockIntakes(intakesData);
            setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des réceptions.", { description: error.message });
            setStockIntakes([]);
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

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

    const renderSkeletons = () => {
        if (viewMode === 'list') {
            return <StockIntakeTableSkeleton />;
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
            </div>
        );
    }

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!stockIntakes || stockIntakes.length === 0) {
            return (
                <EmptyState
                    icon={Archive}
                    title="Aucune réception de stock trouvée"
                    description="Commencez par enregistrer une nouvelle réception de stock."
                >
                     <Button asChild disabled={!isManagerOrAdmin}>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <StockIntakeTable
                    intakes={stockIntakes}
                    supplierMap={supplierMap}
                    onViewDetails={handleViewDetails}
                    onCancelIntake={handleCancelIntake}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stockIntakes.map(s => {
                    const supplier = s.supplierUuid ? supplierMap.get(s.supplierUuid) : undefined;
                    return (
                        <StockIntakeCard 
                            key={s.uuid} 
                            intake={s}
                            supplierName={supplier?.name}
                            onViewDetails={handleViewDetails}
                            onCancelIntake={handleCancelIntake}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Historique des Réceptions de Stock"
                description="Recherchez et consultez toutes les réceptions de marchandises."
            >
                {isManagerOrAdmin && (
                    <Button asChild>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                )}
            </PageHeader>

            <StockIntakeStats intakes={stockIntakes} isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par Fournisseur ou N° Facture..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <DateRangePicker date={dateRange} setDate={setDate} />
                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
            
            <div>{renderContent()}</div>

            <StockIntakeDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                intake={selectedIntake}
                supplierName={selectedIntake?.supplierUuid ? supplierMap.get(selectedIntake.supplierUuid)?.name : 'Fournisseur Inconnu'}
            />

            {isManagerOrAdmin && (
                <CancelIntakeDialog
                    isOpen={isCancelOpen}
                    onOpenChange={setIsCancelOpen}
                    intake={selectedIntake}
                    onSuccess={fetchStockIntakesAndSuppliers}
                />
            )}
        </div>
    );
}
