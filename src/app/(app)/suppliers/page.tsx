
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building, LayoutGrid, List, RefreshCw, Loader2, Phone, Wallet, FileUp, X, SortAsc, Filter } from 'lucide-react';
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
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierDialogOpen(true);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteDialogOpen(true);
    };

    const handleExport = () => {
        if (!filteredAndSortedSuppliers.length) return;
        try {
            supplierService.exportToCSV(filteredAndSortedSuppliers);
            toast.success("Liste des fournisseurs exportée.");
        } catch (e) {
            toast.error("Erreur lors de l'exportation.");
        }
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
                    onEdit={handleEditSupplier}
                    onDelete={handleDeleteSupplier}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedSuppliers.map(s => (
                    <SupplierCard 
                        key={s.uuid} 
                        supplier={s} 
                        onEdit={handleEditSupplier} 
                        onDelete={handleDeleteSupplier}
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
                    <Button variant="outline" onClick={handleExport} disabled={!filteredAndSortedSuppliers.length} className="border-primary/20 luxury-glass h-11">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter CSV
                    </Button>
                    {isManagerOrAdmin && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Fournisseur
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="luxury-glass bg-primary/5 border-primary/10 group overflow-hidden">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Partenaires</span>
                        <Building className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-3xl font-black">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-destructive/5 border-destructive/10 group overflow-hidden">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dette Fournisseurs</span>
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
                    <Input 
                        placeholder="Rechercher un fournisseur par nom ou téléphone..."
                        className="pl-10 h-11 border-primary/10 bg-background/50 focus:border-primary/30 luxury-glass rounded-xl"
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 border-primary/10 luxury-glass rounded-xl min-w-[180px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className={cn("h-4 w-4 text-primary", filterDebtOnly && "animate-pulse")} />
                                    <span className="text-xs font-bold">{filterDebtOnly ? 'Filtré: Dettes' : 'Tous les fournisseurs'}</span>
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50">Filtrage des comptes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={!filterDebtOnly}
                                onCheckedChange={() => setFilterDebtOnly(false)}
                            >Afficher Tout</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filterDebtOnly}
                                onCheckedChange={() => setFilterDebtOnly(true)}
                            >Uniquement avec solde dû</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 border-primary/10 luxury-glass rounded-xl min-w-[180px] justify-between">
                                <span className="flex items-center gap-2">
                                    <SortAsc className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold">Trier: {sortOptions[sortBy]}</span>
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass w-56">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50">Trier la liste par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                                {Object.entries(sortOptions).map(([key, value]) => (
                                    <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('grid')} title="Vue Grille">
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('list')} title="Vue Liste">
                            <List className="h-5 w-5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-primary/10 rounded-xl luxury-glass" onClick={() => fetchSuppliers(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            <div className="min-h-[400px]">
               {renderContent()}
            </div>

            <SupplierDialog 
                isOpen={isSupplierDialogOpen}
                onOpenChange={setIsSupplierDialogOpen}
                supplier={selectedSupplier}
                onSuccess={fetchSuppliers}
            />
            
            {isManagerOrAdmin && (
                <DeleteSupplierDialog 
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    supplier={selectedSupplier}
                    onSuccess={fetchSuppliers}
                />
            )}
        </div>
    );
}
