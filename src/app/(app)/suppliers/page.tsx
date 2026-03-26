
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building, LayoutGrid, List, RefreshCw, Loader2, Wallet, FileUp, X, SortAsc, Filter, FileDown, Trash2 } from 'lucide-react';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierDialog } from '@/components/suppliers/SupplierDialog';
import { DeleteSupplierDialog } from '@/components/suppliers/DeleteSupplierDialog';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { supplierService } from '@/services/supplier.service';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ImportSuppliersPreviewDialog } from '@/components/suppliers/ImportSuppliersPreviewDialog';
import { DeleteMultipleSuppliersDialog } from '@/components/suppliers/DeleteMultipleSuppliersDialog';

const sortOptions: { [key: string]: string } = {
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'balance_desc': 'Dette (Plus élevée)',
    'balance_asc': 'Dette (Moins élevée)',
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
};

export default function SuppliersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.supplierViewMode,
        setViewMode: state.actions.setSupplierViewMode,
    }));

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

    // Import states
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<any>(null);
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fetchSuppliers = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const data = await supplierService.getSuppliers();
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
                                 (s.phone && s.phone.includes(debouncedSearch));
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
        if (selectedSuppliers.size === suppliers.length) {
            setSelectedSuppliers(new Set());
        } else {
            setSelectedSuppliers(new Set(suppliers.map(s => s.uuid)));
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await supplierService.parseAndAnalyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse.");
        } finally {
            setIsAnalyzing(false);
            e.target.value = '';
        }
    };

    const handleConfirmImport = async (data: any) => {
        setIsImporting(true);
        try {
            await supplierService.executeImport(data);
            toast.success("Importation terminée.");
            setIsImportPreviewOpen(false);
            fetchSuppliers();
        } catch (error: any) {
            toast.error("Erreur d'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = () => {
        if (!filteredAndSortedSuppliers.length) return;
        supplierService.exportToCSV(filteredAndSortedSuppliers);
    };

    const renderContent = () => {
        if (suppliers === undefined) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                </div>
            );
        }

        if (filteredAndSortedSuppliers.length === 0) {
            return (
                <EmptyState
                    icon={Building}
                    title="Aucun fournisseur trouvé"
                    description={searchQuery ? "Aucun résultat pour cette recherche." : "Commencez par ajouter votre premier fournisseur partenaire."}
                >
                     {!searchQuery && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="rounded-xl luxury-glass bg-primary/10 border-primary/20 text-primary">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un fournisseur
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Fournisseurs"
                description="Suivez vos partenaires commerciaux et l'état de vos dettes fournisseurs."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={isAnalyzing} className="border-primary/20 luxury-glass h-11">
                                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="mr-2 h-4 w-4" />}
                                Importer
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass">
                            <DropdownMenuItem asChild>
                                <label className="cursor-pointer w-full flex items-center gap-2">
                                    <span>Fichier CSV</span>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileSelected} />
                                </label>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleExport} disabled={!filteredAndSortedSuppliers.length} className="border-primary/20 luxury-glass h-11">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="luxury-glass bg-primary/5 border-primary/10 group overflow-hidden">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partenaires</span>
                        <Building className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-3xl font-black">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-destructive/5 border-destructive/10 group overflow-hidden">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dette Totale</span>
                        <Wallet className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-3xl font-black text-destructive">{formatCurrency(stats.totalDebt)}</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-blue-500/5 border-blue-500/10 group overflow-hidden">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comptes Actifs</span>
                        <RefreshCw className="h-4 w-4 text-blue-400 group-hover:rotate-180 transition-all duration-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-3xl font-black text-blue-400">{stats.activeSuppliers}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." className="pl-10 h-11 luxury-glass rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 luxury-glass rounded-xl min-w-[180px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold">{filterDebtOnly ? 'Dettes uniquement' : 'Tous'}</span>
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56">
                            <DropdownMenuCheckboxItem checked={!filterDebtOnly} onCheckedChange={() => setFilterDebtOnly(false)}>Tous</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterDebtOnly} onCheckedChange={() => setFilterDebtOnly(true)}>Avec solde dû</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 luxury-glass rounded-xl min-w-[180px] justify-between">
                                <SortAsc className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold">{sortOptions[sortBy]}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56">
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-5 w-5"/></Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-11 w-11 luxury-glass" onClick={() => fetchSuppliers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedSuppliers.size > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-xl p-3 animate-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-primary">{selectedSuppliers.size} مورد(ين) مختار(ين)</span>
                    <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)} className="rounded-lg h-8">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer la sélection
                    </Button>
                </div>
            )}
            
            <div className="min-h-[400px]">
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
