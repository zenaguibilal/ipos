
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, Search, Building, LayoutGrid, List, RefreshCw, 
    Wallet, FileUp, SortAsc, Filter, FileDown, Trash2, 
    Loader2, ChevronDown, Activity, RotateCcw
} from 'lucide-react';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierDialog } from '@/components/suppliers/SupplierDialog';
import { DeleteSupplierDialog } from '@/components/suppliers/DeleteSupplierDialog';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { cn, formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ImportSuppliersPreviewDialog } from '@/components/suppliers/ImportSuppliersPreviewDialog';
import { DeleteMultipleSuppliersDialog } from '@/components/suppliers/DeleteMultipleSuppliersDialog';
import { PrintSupplierListDialog } from '@/components/suppliers/PrintSupplierListDialog';
import { CsvImporter } from '@/lib/csv-utils';
import { Badge } from '@/components/ui/badge';

const sortOptions: { [key: string]: string } = {
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'balance_desc': 'Dette (Plus élevée)',
    'balance_asc': 'Dette (Moins élevée)',
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
};

/**
 * @fileOverview Sovereign Supplier Management (Finalized Perfection)
 * المركز السيادي للتحكم في الموردين والديون اللوجستية.
 */

export default function SuppliersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { viewMode } = useAppStore(state => ({
        viewMode: state.supplierViewMode
    }));
    const { setSupplierViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [filterDebtOnly, setFilterDebtOnly] = useState(false);
    const [sortBy, setSortBy] = useState('name_asc');
    
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
    
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<any>(null);
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fetchSuppliers = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const data = await api.get<Supplier[]>('suppliers');
            setSuppliers(data);
        } catch (error: any) {
            toast.error("Impossible de charger les fournisseurs.");
            setSuppliers([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const filteredAndSortedSuppliers = useMemo(() => {
        if (!suppliers) return [];
        
        let result = suppliers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                                 (s.phone && s.phone.includes(debouncedSearch)) ||
                                 (s.contactPerson && s.contactPerson.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchesDebt = filterDebtOnly ? s.balance > 0 : true;
            return matchesSearch && matchesDebt;
        });

        const [field, order] = sortBy.split('_');
        const isAsc = order === 'asc';

        result.sort((a, b) => {
            if (field === 'name') return isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            if (field === 'balance') return isAsc ? a.balance - b.balance : b.balance - a.balance;
            if (field === 'createdAt') {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return isAsc ? dateA - dateB : dateB - dateA;
            }
            return 0;
        });

        return result;
    }, [suppliers, debouncedSearch, filterDebtOnly, sortBy]);

    const stats = useMemo(() => ({
        total: suppliers?.length || 0,
        totalDebt: suppliers?.reduce((sum, s) => sum + s.balance, 0) || 0,
        activeSuppliers: suppliers?.filter(s => s.balance > 0).length || 0
    }), [suppliers]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedSuppliers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!suppliers) return;
        if (selectedSuppliers.size === filteredAndSortedSuppliers.length) {
            setSelectedSuppliers(new Set());
        } else {
            setSelectedSuppliers(new Set(filteredAndSortedSuppliers.map(s => s.uuid)));
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await CsvImporter.analyzeSuppliers(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse du fichier CSV.");
        } finally {
            setIsAnalyzing(false);
            e.target.value = '';
        }
    };

    const handleConfirmImport = async (data: any) => {
        setIsImporting(true);
        try {
            await api.post('suppliers/bulk-import', data);
            toast.success("Opération d'importation terminée.", {
                description: `${data.toAdd.length} nouveaux et ${data.toUpdate.length} mises à jour.`
            });
            setIsImportPreviewOpen(false);
            fetchSuppliers();
        } catch (error: any) {
            toast.error("Échec de l'importation collective.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = () => {
        if (!filteredAndSortedSuppliers.length) return;
        CsvImporter.exportSuppliers(filteredAndSortedSuppliers);
        toast.success("Registre exporté avec succès.");
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterDebtOnly(false);
        setSortBy('name_asc');
        setSelectedSuppliers(new Set());
    };

    const renderContent = () => {
        if (suppliers === undefined) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)}
                </div>
            );
        }

        if (filteredAndSortedSuppliers.length === 0) {
            return (
                <EmptyState
                    icon={Building}
                    title="Aucun partenaire détecté"
                    description={searchQuery ? "La recherche n'a retourné aucun résultat." : "Commencez par référencer votre premier fournisseur."}
                    className="py-32 luxury-glass border-white/5 bg-muted/5"
                >
                     {!searchQuery ? (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="rounded-2xl px-10 h-14 bg-primary shadow-2xl shadow-primary/20 font-black uppercase text-[11px] tracking-widest">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un fournisseur
                        </Button>
                     ) : (
                        <Button variant="outline" onClick={handleResetFilters} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                            <RotateCcw className="h-4 w-4 mr-2" /> Effacer les filtres
                        </Button>
                     )}
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <SupplierTable 
                    suppliers={filteredAndSortedSuppliers}
                    onEdit={(s) => { setSelectedSupplier(s); setIsSupplierDialogOpen(true); }}
                    onDelete={(s) => { setSelectedSupplier(s); setIsDeleteDialogOpen(true); }}
                    selectedSuppliers={selectedSuppliers}
                    onToggleSelection={handleToggleSelection}
                    onToggleAll={handleSelectAll}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedSuppliers.map(s => (
                    <SupplierCard 
                        key={s.uuid} 
                        supplier={s} 
                        onEdit={(s) => { setSelectedSupplier(s); setIsSupplierDialogOpen(true); }}
                        onDelete={(s) => { setSelectedSupplier(s); setIsDeleteDialogOpen(true); }}
                        isSelected={selectedSuppliers.has(s.uuid)}
                        onToggleSelection={() => handleToggleSelection(s.uuid)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader
                title="Souveraineté des Partenaires"
                description="Contrôle absolu du catalogue fournisseurs et maîtrise des encours de dettes."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintSupplierListDialog suppliers={filteredAndSortedSuppliers} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={isAnalyzing} className="border-primary/20 luxury-glass h-12 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                Importer
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2">
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10">
                                <label className="w-full flex items-center gap-3 p-3 font-bold">
                                    <FileDown className="h-4 w-4 text-primary" />
                                    <span className="text-xs uppercase tracking-tight">Fichier CSV Standard</span>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileSelected} />
                                </label>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleExport} disabled={!filteredAndSortedSuppliers.length} className="border-primary/20 luxury-glass h-12 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2">
                            <Plus className="h-4 w-4" /> Nouveau
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card className="luxury-glass bg-muted/10 border-white/5 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Building className="h-24 w-24 rotate-12" />
                    </div>
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Registre Actif</span>
                        <Building className="h-4 w-4 text-primary opacity-50" />
                    </CardHeader>
                    <CardContent className="px-6 pb-6 relative z-10">
                        <p className="text-4xl font-black tracking-tighter">{stats.total}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-60">Entités Référencées</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-destructive/5 border-white/5 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Wallet className="h-24 w-24 rotate-12" />
                    </div>
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Encours Global Dettes</span>
                        <Wallet className="h-4 w-4 text-destructive opacity-50" />
                    </CardHeader>
                    <CardContent className="px-6 pb-6 relative z-10">
                        <p className="text-4xl font-black tracking-tighter text-destructive">{formatCurrency(stats.totalDebt)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-60">À solder aux partenaires</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-chart-quaternary/5 border-white/5 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Activity className="h-24 w-24 rotate-12" />
                    </div>
                    <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0 relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Comptes Créditeurs</span>
                        <Activity className="h-4 w-4 text-chart-quaternary opacity-50" />
                    </CardHeader>
                    <CardContent className="px-6 pb-6 relative z-10">
                        <p className="text-4xl font-black tracking-tighter text-chart-quaternary">{stats.activeSuppliers}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-60">Flux financiers ouverts</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par nom, contact ou téléphone..." 
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[180px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-primary" />
                                    {filterDebtOnly ? 'Dettes uniquement' : 'Tous les comptes'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56 p-2">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Filtrage des Comptes</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuCheckboxItem checked={!filterDebtOnly} onCheckedChange={() => setFilterDebtOnly(false)} className="font-bold py-2">Tous les partenaires</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterDebtOnly} onCheckedChange={() => setFilterDebtOnly(true)} className="font-bold py-2 text-destructive">Avec solde débiteur</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[180px] justify-between">
                                <span className="flex items-center gap-2">
                                    <SortAsc className="h-3.5 w-3.5 text-primary" />
                                    {sortOptions[sortBy]}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56 p-2">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1">Tri des Registres</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key} className="font-bold py-2">{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSupplierViewMode('grid')}>
                            <LayoutGrid className="h-4 w-4"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSupplierViewMode('list')}>
                            <List className="h-4 w-4"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => fetchSuppliers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedSuppliers.size > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-top-4 duration-500 shadow-lg">
                    <div className="flex items-center gap-4">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-black text-xs">
                            {selectedSuppliers.size} مورد(ين) مختار(ين)
                        </Badge>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Actions sur la sélection</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6">
                        <Trash2 className="h-4 w-4" /> 
                        Révocation Collective
                    </Button>
                </div>
            )}
            
            <div className="min-h-[500px]">
               {renderContent()}
            </div>

            <SupplierDialog isOpen={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={selectedSupplier} onSuccess={fetchSuppliers} />
            
            {isManagerOrAdmin && (
                <>
                    <DeleteSupplierDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} supplier={selectedSupplier} onSuccess={fetchSuppliers} />
                    <DeleteMultipleSuppliersDialog isOpen={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen} supplierUuids={Array.from(selectedSuppliers)} onSuccess={() => { setSelectedSuppliers(new Set()); fetchSuppliers(); }} />
                    <ImportSuppliersPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
                </>
            )}
        </div>
    );
}
