
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive, LayoutGrid, List, RefreshCw, ShieldAlert, Filter, Building, FileUp, Trash2, Printer, ShieldX, Lock } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeTable } from '@/components/stock/stock-intake-table';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import { PrintStockListDialog } from '@/components/stock/PrintStockListDialog';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { CancelIntakeDialog } from '@/components/stock/CancelIntakeDialog';
import { StockIntakeStats } from '@/components/stock/StockIntakeStats';
import { DeleteMultipleIntakesDialog } from '@/components/stock/DeleteMultipleIntakesDialog';
import { cn } from '@/lib/utils';
import { CsvImporter } from '@/lib/csv-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

/**
 * @fileOverview Sovereign Stock & Intake Ledger (Finalized with Granular Permission)
 */

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
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const [stockIntakes, setStockIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierMap, setSupplierMap] = useState<Map<string, Supplier>>(new Map());
    const [selectedSupplierUuid, setSelectedSupplierUuid] = useState<string>('all');
    const [selectedIntakes, setSelectedIntakes] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isAllowed = profile?.permissions?.includes('stock') || isManagerOrAdmin;

    // Granular Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Unité Réceptions Restreinte", { 
                description: "Vous ne possédez pas le décret nécessaire pour cette unité.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);

    const fetchStockIntakesAndSuppliers = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange?.from || !isAllowed) return;
        if (manual) setIsRefreshing(true);
        
        try {
            const query = new URLSearchParams({
                query: debouncedSearchQuery,
                from: dateRange.from?.toISOString() || '',
                to: dateRange.to?.toISOString() || '',
                supplierUuid: selectedSupplierUuid
            }).toString();

            const [intakesData, suppliersData] = await Promise.all([
                api.get<StockIntake[]>(`stock?${query}`),
                api.get<Supplier[]>('suppliers')
            ]);

            setStockIntakes(intakesData);
            setSuppliers(suppliersData);
            setSupplierMap(new Map(suppliersData.map(s => [s.uuid, s])));
            setSelectedIntakes(new Set()); 
        } catch (error: any) {
            toast.error("Impossible de synchroniser le registre.");
            setStockIntakes([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, debouncedSearchQuery, dateRange, isAllowed, selectedSupplierUuid]);

    useEffect(() => {
        if (isAllowed) fetchStockIntakesAndSuppliers();
    }, [fetchStockIntakesAndSuppliers, isAllowed]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedIntakes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!stockIntakes) return;
        if (selectedIntakes.size === stockIntakes.length) {
            setSelectedIntakes(new Set());
        } else {
            setSelectedIntakes(new Set(stockIntakes.map(i => i.uuid)));
        }
    };

    const handleViewDetails = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    }, []);

    const handleCancelIntake = useCallback((intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsCancelOpen(true);
    }, []);

    const handleExportCSV = () => {
        if (!stockIntakes || stockIntakes.length === 0) {
            toast.error("Aucune donnée à exporter.");
            return;
        }
        CsvImporter.exportStockIntakes(stockIntakes, supplierMap);
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint à l'Unité Stock</p>
                </div>
            </div>
        );
    }

    const isLoading = stockIntakes === undefined;

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader
                title="Registre de Tissage Stock"
                description="Suivi souverain des réceptions de marchandises et ingénierie des coûts de revient."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintStockListDialog intakes={stockIntakes || []} supplierMap={supplierMap} />
                    <Button variant="outline" onClick={handleExportCSV} disabled={isLoading} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" /> 
                        Exporter CSV
                    </Button>
                    {isManagerOrAdmin && (
                        <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Link href="/stock/intake">
                                <Plus className="h-4 w-4" /> 
                                Nouvelle Réception
                            </Link>
                        </Button>
                    )}
                </div>
            </PageHeader>

            <StockIntakeStats intakes={stockIntakes} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par N° Facture..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[160px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Building className="h-3.5 w-3.5 text-primary" />
                                    {selectedSupplierUuid === 'all' ? 'Tous les fournisseurs' : supplierMap.get(selectedSupplierUuid)?.name}
                                </span>
                                <Filter className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2">Filtrer par Partenaire</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={selectedSupplierUuid} onValueChange={setSelectedSupplierUuid}>
                                <DropdownMenuRadioItem value="all" className="font-bold py-2">Tout afficher</DropdownMenuRadioItem>
                                {suppliers.map(s => (
                                    <DropdownMenuRadioItem key={s.uuid} value={s.uuid} className="font-bold py-2">
                                        {s.name}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setStockViewMode('grid')}>
                            <LayoutGrid className="h-4 w-4"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setStockViewMode('list')}>
                            <List className="h-4 w-4"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => fetchStockIntakesAndSuppliers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedIntakes.size > 0 && (
                <div className="flex justify-between items-center bg-destructive/10 border border-destructive/20 rounded-2xl p-4 animate-in slide-in-from-top-4 duration-500">
                    <span className="text-xs font-black uppercase text-destructive tracking-widest">
                        {selectedIntakes.size} réception(s) sélectionnée(s)
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)} className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
                        <Trash2 className="h-4 w-4" />
                        Annuler la sélection
                    </Button>
                </div>
            )}
            
            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                    </div>
                ) : stockIntakes?.length === 0 ? (
                    <EmptyState
                        icon={Archive}
                        title="Aucun flux de stock détecté"
                        description={selectedSupplierUuid !== 'all' || searchQuery ? "Aucun bon ne correspond à vos filtres actuels." : "Commencez par enregistrez une réception de marchandise pour alimenter votre inventaire."}
                        className="py-32 luxury-glass border-white/5 bg-muted/5"
                    >
                         {selectedSupplierUuid === 'all' && !searchQuery && isManagerOrAdmin && (
                            <Button asChild className="rounded-2xl px-10 h-14 bg-primary shadow-2xl shadow-primary/20 font-black uppercase text-[11px] tracking-widest">
                                <Link href="/stock/intake">Initialiser le Flux</Link>
                            </Button>
                         )}
                    </EmptyState>
                ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-1000">
                        {viewMode === 'list' ? (
                            <StockIntakeTable
                                intakes={stockIntakes!}
                                supplierMap={supplierMap}
                                onViewDetails={handleViewDetails}
                                onCancelIntake={handleCancelIntake}
                                selectedIntakes={selectedIntakes}
                                onToggleSelection={handleToggleSelection}
                                onToggleAll={handleSelectAll}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                {stockIntakes?.map(s => (
                                    <StockIntakeCard 
                                        key={s.uuid} 
                                        intake={s}
                                        supplierName={s.supplierUuid ? supplierMap.get(s.supplierUuid)?.name : undefined}
                                        onViewDetails={handleViewDetails}
                                        onCancelIntake={handleCancelIntake}
                                        isSelected={selectedIntakes.has(s.uuid)}
                                        onToggleSelection={() => handleToggleSelection(s.uuid)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
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

            <DeleteMultipleIntakesDialog
                isOpen={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                intakeUuids={Array.from(selectedIntakes)}
                onSuccess={() => fetchStockIntakesAndSuppliers(true)}
            />
        </div>
    );
}
