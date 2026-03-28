
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Plus, Search, RefreshCw, LayoutGrid, List, FileUp, 
    FileDown, Trash2, RotateCcw, X, Filter, ChevronDown, 
    SortAsc, UserPlus, Users, Wallet, AlertTriangle, UserCheck, Activity, ShieldX, Lock
} from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerTableSkeleton } from '@/components/customers/customer-table-skeleton';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { PrintCustomerListDialog } from '@/components/customers/PrintCustomerListDialog';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { CsvImporter } from '@/lib/csv-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
 * @fileOverview Customers Sovereign Ledger (Finalized with Granular Permission)
 */

const sortOptions = {
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'debt_desc': 'Dette (Plus élevée)',
    'debt_asc': 'Dette (Moins élevée)',
    'activity_desc': 'Activité Récente',
    'newest': 'Nouveaux Membres',
};

type DebtFilter = 'all' | 'debtors' | 'overlimit';

export default function CustomersPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, customers, isLoading, viewMode } = useAppStore(state => ({
        profile: state.profile,
        customers: state.customers,
        isLoading: state.isLoading.customers,
        viewMode: state.customerViewMode
    }));
    const { refreshCustomers, setCustomerViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    
    const [sortBy, setSortBy] = useState('name_asc');
    const [debtFilter, setDebtFilter] = useState<DebtFilter>('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomerUuids, setSelectedCustomerUuids] = useState<Set<string>>(new Set());
    
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const isAllowed = profile?.permissions?.includes('customers') || isManagerOrAdmin;

    // Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Unité Clientèle Restreinte", { 
                description: "Vous ne possédez pas le décret nécessaire pour accéder au registre.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);

    useEffect(() => {
        if (isAllowed) {
            refreshCustomers();
            api.get<string[]>('customers/categories').then(setCategories).catch(() => {});
        }
    }, [refreshCustomers, isAllowed]);

    const filteredAndSortedCustomers = useMemo(() => {
        let result = customers.filter(c => {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(debouncedSearch.toLowerCase()) ||
                                 (c.phone && c.phone.includes(debouncedSearch));
            
            const matchesDebt = debtFilter === 'all' ? true :
                               debtFilter === 'debtors' ? c.outstandingBalance > 0 :
                               debtFilter === 'overlimit' ? c.isOverLimit : true;
            
            const matchesCategory = selectedCategory === 'all' ? true : c.category === selectedCategory;

            return matchesSearch && matchesDebt && matchesCategory;
        });

        const [field, order] = sortBy.split('_');
        const isAsc = order === 'asc';

        result.sort((a, b) => {
            if (field === 'name') return isAsc ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`) : `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
            if (field === 'debt') return isAsc ? a.outstandingBalance - b.outstandingBalance : b.outstandingBalance - a.outstandingBalance;
            if (field === 'activity') return new Date(b.lastActivityDate || 0).getTime() - new Date(a.lastActivityDate || 0).getTime();
            if (field === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
        });

        return result;
    }, [customers, debouncedSearch, sortBy, debtFilter, selectedCategory]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedCustomerUuids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedCustomerUuids.size === filteredAndSortedCustomers.length) {
            setSelectedCustomerUuids(new Set());
        } else {
            setSelectedCustomerUuids(new Set(filteredAndSortedCustomers.map(c => c.uuid)));
        }
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const analysis = await CsvImporter.analyzeCustomers(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse du fichier CSV.");
        } finally {
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await api.post('customers/bulk', confirmedData);
            toast.success("Opération d'importation réussie.");
            setIsImportPreviewOpen(false);
            refreshCustomers();
        } catch (error: any) {
            toast.error("Échec de l'importation collective.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSortBy('name_asc');
        setDebtFilter('all');
        setSelectedCategory('all');
        setSelectedCustomerUuids(new Set());
        refreshCustomers();
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint à l'Unité Clientèle</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté de la Clientèle" 
                description="Contrôle absolu des comptes, gestion des créances و historique des flux clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintCustomerListDialog customers={filteredAndSortedCustomers} />
                    <Button variant="outline" onClick={() => CsvImporter.exportCustomers(customers)} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" /> Exporter CSV
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button asChild variant="outline" className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                                <label className="cursor-pointer">
                                    <FileDown className="h-4 w-4" /> Importer
                                    <input type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
                                </label>
                            </Button>
                            <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> Nouveau Client
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <CustomerStats />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par nom, prénom ou téléphone..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[160px] justify-between">
                                <span className="flex items-center gap-2">
                                    <Wallet className="h-3.5 w-3.5 text-primary" />
                                    {debtFilter === 'all' ? 'Tous les comptes' : debtFilter === 'debtors' ? 'Débiteurs' : 'Hors-Limite'}
                                </span>
                                <Filter className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[200px]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2">Filtrage des Dettes</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={debtFilter} onValueChange={(v) => setDebtFilter(v as DebtFilter)}>
                                <DropdownMenuRadioItem value="all" className="font-bold py-2">Tout afficher</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="debtors" className="font-bold py-2 text-destructive">Avec solde débiteur</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="overlimit" className="font-bold py-2 text-destructive">Plafond dépassement</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[140px] justify-between">
                                <span className="flex items-center gap-2">
                                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                                    {selectedCategory === 'all' ? 'Toutes catégories' : selectedCategory}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[180px]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2">Rayon Clientèle</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                                <DropdownMenuRadioItem value="all" className="font-bold py-2">Toutes</DropdownMenuRadioItem>
                                {categories.map(cat => (
                                    <DropdownMenuRadioItem key={cat} value={cat} className="font-bold py-2">{cat}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setCustomerViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setCustomerViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-destructive/10" onClick={handleResetFilters} title="Réinitialiser">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => refreshCustomers()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedCustomerUuids.size > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-[1.5rem] p-4 animate-in slide-in-from-top-4 duration-500 shadow-lg">
                    <div className="flex items-center gap-4">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-black text-xs">
                            {selectedCustomerUuids.size} sélectionné(s)
                        </Badge>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Actions de masse sur les comptes</p>
                    </div>
                    {isManagerOrAdmin && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)} 
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6 shadow-lg shadow-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" /> 
                            Révocation Massive
                        </Button>
                    )}
                </div>
            )}

            <div className="min-h-[500px]">
               {isLoading && customers.length === 0 ? <CustomerTableSkeleton /> : filteredAndSortedCustomers.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-32 opacity-30 grayscale space-y-6">
                        <UserPlus className="h-20 w-20 text-primary" />
                        <div className="text-center space-y-2">
                            <p className="text-xl font-black uppercase tracking-widest">Aucun client détecté</p>
                            <p className="text-xs font-bold uppercase tracking-tighter italic">La base de données souveraine est vide ou filtrée.</p>
                        </div>
                   </div>
               ) : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {filteredAndSortedCustomers.map(c => (
                               <CustomerCard 
                                    key={c.uuid} 
                                    customer={c} 
                                    onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} 
                                    onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} 
                                    onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} 
                                    onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }}
                                    isSelected={selectedCustomerUuids.has(c.uuid)}
                                    onToggleSelection={() => handleToggleSelection(c.uuid)}
                                />
                           ))}
                       </div>
                   ) : (
                       <CustomerTable 
                            customers={filteredAndSortedCustomers} 
                            onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} 
                            onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} 
                            onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} 
                            onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }} 
                            selectedCustomers={selectedCustomerUuids}
                            onToggleSelection={handleToggleSelection}
                            onToggleAll={handleSelectAll}
                        />
                   )
               )}
            </div>

            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} onSuccess={() => refreshCustomers()} />
            {isManagerOrAdmin && <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} customer={selectedCustomer} onSuccess={() => refreshCustomers()} />}
            {isManagerOrAdmin && <DeleteMultipleCustomersDialog isOpen={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen} customerUuids={Array.from(selectedCustomerUuids)} onSuccess={() => { setSelectedCustomerUuids(new Set()); refreshCustomers(); }} />}
            
            <ImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
            
            {selectedCustomer && (
                <>
                    <AddPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} customer={selectedCustomer} onPaymentSuccess={() => refreshCustomers()} />
                    <PrintStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} customer={selectedCustomer} />
                </>
            )}
        </div>
    );
}
