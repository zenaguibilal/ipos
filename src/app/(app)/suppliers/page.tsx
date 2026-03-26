
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building, LayoutGrid, List, RefreshCw, Loader2, Phone, DollarSign, Wallet, FileUp, X } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";

export default function SuppliersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.supplierViewMode,
        setViewMode: state.actions.setSupplierViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [filterDebtOnly, setFilterDebtOnly] = useState(false);
    
    // Dialog states
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    
    // Data states
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

    const filteredSuppliers = (suppliers || []).filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                             (s.phone && s.phone.includes(debouncedSearch));
        const matchesDebt = filterDebtOnly ? s.balance > 0 : true;
        return matchesSearch && matchesDebt;
    });

    const stats = {
        total: suppliers?.length || 0,
        totalDebt: suppliers?.reduce((sum, s) => sum + s.balance, 0) || 0,
        activeSuppliers: suppliers?.filter(s => s.balance > 0).length || 0
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsSupplierDialogOpen(true);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteDialogOpen(true);
    };

    const handleExport = () => {
        if (!filteredSuppliers.length) return;
        // Logic for export can be added to service
        toast.info("Fonctionnalité d'exportation bientôt disponible.");
    };

    const renderContent = () => {
        if (suppliers === undefined) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                </div>
            );
        }

        if (filteredSuppliers.length === 0) {
            return (
                <EmptyState
                    icon={Building}
                    title="Aucun fournisseur trouvé"
                    description={searchQuery ? "Aucun résultat pour cette recherche." : "Commencez par ajouter votre premier fournisseur partenaire."}
                >
                     {!searchQuery && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un fournisseur
                        </Button>
                     )}
                </EmptyState>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <SupplierTable 
                    suppliers={filteredSuppliers}
                    onEdit={handleEditSupplier}
                    onDelete={handleDeleteSupplier}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map(s => (
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
                    <Button variant="outline" onClick={handleExport} disabled={!filteredSuppliers.length} className="border-primary/20 luxury-glass">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <Button onClick={() => { setSelectedSupplier(null); setIsSupplierDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Nouveau Fournisseur
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="luxury-glass bg-primary/5 border-primary/10">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Partenaires</span>
                        <Building className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-2xl font-black">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-destructive/5 border-destructive/10">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dette Fournisseurs</span>
                        <Wallet className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-2xl font-black text-destructive">{formatCurrency(stats.totalDebt)}</p>
                    </CardContent>
                </Card>
                <Card className="luxury-glass bg-blue-500/5 border-blue-500/10">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comptes Actifs</span>
                        <RefreshCw className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-2xl font-black text-blue-400">{stats.activeSuppliers}</p>
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
                            <Button variant="outline" className="h-11 border-primary/10 luxury-glass rounded-xl">
                                <Plus className={cn("mr-2 h-4 w-4 transition-transform", filterDebtOnly && "rotate-45")} />
                                {filterDebtOnly ? 'Filtré: Dettes' : 'Tous les fournisseurs'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="luxury-glass">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50">Filtrage</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={!filterDebtOnly}
                                onCheckedChange={() => setFilterDebtOnly(false)}
                            >Afficher Tout</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={filterDebtOnly}
                                onCheckedChange={() => setFilterDebtOnly(true)}
                            >Uniquement avec solde</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className="h-5 w-5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setViewMode('list')}>
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
