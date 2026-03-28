
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, LayoutGrid, List, FileUp, FileDown, Trash2, Printer, RotateCcw, X, Wallet } from 'lucide-react';
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

/**
 * @fileOverview Sovereign Customer Ledger (Finalized Perfection)
 * المركز السيادي للتحكم في حسابات الزبائن، الديون، والعمليات الجماعية.
 */

export default function CustomersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { customers, isLoading, viewMode } = useAppStore(state => ({
        customers: state.customers,
        isLoading: state.isLoading.customers,
        viewMode: state.customerViewMode
    }));
    const { refreshCustomers, setCustomerViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

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

    useEffect(() => {
        refreshCustomers();
    }, [refreshCustomers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(debouncedSearch))
        );
    }, [customers, debouncedSearch]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedCustomerUuids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedCustomerUuids.size === filteredCustomers.length) {
            setSelectedCustomerUuids(new Set());
        } else {
            setSelectedCustomerUuids(new Set(filteredCustomers.map(c => c.uuid)));
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
            toast.success("Opération d'importation réussie.", {
                description: `${confirmedData.toAdd.length} nouveaux زبائن و ${confirmedData.toUpdate.length} mises à jour.`
            });
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
        setSelectedCustomerUuids(new Set());
        refreshCustomers();
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté de la Clientèle" 
                description="Contrôle absolu des comptes, gestion des créances و historique des flux clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintCustomerListDialog customers={filteredCustomers} />
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
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5">
                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-destructive/10" onClick={handleResetFilters} title="Réinitialiser">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setCustomerViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setCustomerViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

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
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6"
                        >
                            <Trash2 className="h-4 w-4" /> 
                            Révocation Massive
                        </Button>
                    )}
                </div>
            )}

            <div className="min-h-[500px]">
               {isLoading && customers.length === 0 ? <CustomerTableSkeleton /> : filteredCustomers.length === 0 ? (
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
                           {filteredCustomers.map(c => (
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
                            customers={filteredCustomers} 
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

// Fixed missing icon imports
import { UserPlus } from 'lucide-react';
