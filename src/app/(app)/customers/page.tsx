'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown, Loader2, FileUp, Trash2, LayoutGrid, List, RefreshCw, Printer, SortAsc } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerTableSkeleton } from '@/components/customers/customer-table-skeleton';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';

const sortOptions: { [key: string]: string } = {
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'balance_desc': 'Dette (Plus élevée)',
    'balance_asc': 'Dette (Moins élevée)',
    'spent_desc': 'Dépenses (Plus élevées)',
};

const ITEMS_PER_PAGE = 12;

export default function CustomersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const searchParams = useSearchParams();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.customerViewMode,
        setViewMode: state.actions.setCustomerViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');
    
    // Dialog states
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Data states
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [statsRefreshKey, setStatsRefreshKey] = useState(0);

    // States for CSV Import
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const statusFromQuery = searchParams.get('status') as FilterStatus;
        if (statusFromQuery && ['all', 'has_debt', 'overdue', 'over_limit', 'is_bread_client'].includes(statusFromQuery)) {
            setFilterStatus(statusFromQuery);
        }
    }, [searchParams]);

    const fetchCustomers = useCallback(async (isInitial = true) => {
        if (isInitial) {
            setIsLoading(true);
            setPage(1);
        }
        
        try {
            const currentPage = isInitial ? 1 : page + 1;
            const result = await customerService.filterCustomers({ 
                query: debouncedSearchQuery, 
                status: filterStatus,
                page: currentPage,
                pageSize: ITEMS_PER_PAGE,
                sortBy: sortBy
            });
            
            let updatedCustomers: Customer[];
            if (isInitial) {
                updatedCustomers = result.data;
            } else {
                updatedCustomers = [...customers, ...result.data];
                setPage(currentPage);
            }
            
            setCustomers(updatedCustomers);
            setTotalCount(result.total);
            setHasMore(updatedCustomers.length < result.total);
        } catch (error: any) {
            toast.error("Impossible de charger les clients.", { description: error.message });
            if (isInitial) setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, filterStatus, page, customers, sortBy]);
    
    useEffect(() => {
        fetchCustomers(true);
    }, [debouncedSearchQuery, filterStatus, sortBy]);

    useEffect(() => {
        setSelectedCustomers(new Set());
    }, [customers.length]);

    const handleEditCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    }, []);

    const handleDeleteCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    }, []);

    const handlePaymentClick = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsPaymentDialogOpen(true);
    }, []);

    const handleStatementClick = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsStatementDialogOpen(true);
    }, []);

    const handleToggleSelection = useCallback((customerUuid: string) => {
        setSelectedCustomers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(customerUuid)) {
                newSet.delete(customerUuid);
            } else {
                newSet.add(customerUuid);
            }
            return newSet;
        });
    }, []);
    
    const handleToggleSelectAll = useCallback(() => {
        if (selectedCustomers.size === customers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(customers.map(c => c.uuid)));
        }
    }, [customers, selectedCustomers.size]);

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const analysis = await customerService.parseAndAnalyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'analyse du fichier.", { description: error.message });
        } finally {
            setIsAnalyzing(false);
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await customerService.executeImport(confirmedData);
            toast.success("Importation terminée avec succès !");
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
            setStatsRefreshKey(k => k + 1);
            fetchCustomers(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'importation des données.", { description: error.message });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCSV = async () => {
        if (totalCount === 0) {
            toast.info("Aucun client à exporter.");
            return;
        }
        try {
            const result = await customerService.filterCustomers({ query: debouncedSearchQuery, status: filterStatus, pageSize: 1000 });
            await customerService.exportToCSV(result.data);
            toast.success("Liste des clients exportée avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de l'exportation.", { description: error.message });
        }
    };

    const handleDownloadTemplate = () => {
        customerService.exportToCSV([
            { firstName: 'Jean', lastName: 'Dupont', phone: '0555123456', address: '123 Rue de la Liberté', creditLimit: 5000, outstandingBalance: 0 } as any
        ]);
    };
    
    const refreshAll = () => {
        setStatsRefreshKey(k => k + 1);
        fetchCustomers(true);
    };

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
        </div>
    );

    const renderContent = () => {
        if (isLoading && customers.length === 0) {
            return viewMode === 'grid' ? renderSkeletons() : <CustomerTableSkeleton />;
        }

        if (customers.length === 0) {
            return (
                <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description="Ajustez vos filtres ou commencez par ajouter votre premier client."
                >
                     <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                    </Button>
                </EmptyState>
            );
        }
        
        return (
            <div className="space-y-6">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customers.map(c => (
                            <CustomerCard 
                                key={c.uuid} 
                                customer={c} 
                                onEdit={handleEditCustomer} 
                                onDelete={handleDeleteCustomer}
                                onPayment={handlePaymentClick}
                                onStatement={handleStatementClick}
                                isSelected={selectedCustomers.has(c.uuid)}
                                onToggleSelection={() => handleToggleSelection(c.uuid)}
                            />
                        ))}
                    </div>
                ) : (
                    <CustomerTable 
                        customers={customers}
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                        onPayment={handlePaymentClick}
                        onStatement={handleStatementClick}
                        selectedCustomers={selectedCustomers}
                        onToggleCustomerSelection={handleToggleSelection}
                        onToggleSelectAll={handleToggleSelectAll}
                    />
                )}

                {hasMore && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" size="lg" onClick={() => fetchCustomers(false)} disabled={isLoading} className="min-w-[200px]">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Charger plus ({customers.length} / {totalCount})
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Clients"
                description="Recherchez, ajoutez et suivez le solde de vos clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCSV} disabled={isLoading && customers.length === 0}>
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={isAnalyzing}>
                                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                        Importer
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <label htmlFor="csv-customer-importer" className="cursor-pointer w-full">
                                            Choisir un fichier CSV
                                            <input type="file" id="csv-customer-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                                        </label>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDownloadTemplate}>
                                        Télécharger le modèle
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <CustomerStats key={statsRefreshKey} onRefresh={refreshAll} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par nom ou téléphone..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            Filtrer
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Statut du Client</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={filterStatus === 'all'} onCheckedChange={() => setFilterStatus('all')}>Tous les clients</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'has_debt'} onCheckedChange={() => setFilterStatus('has_debt')}>Avec une dette</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'overdue'} onCheckedChange={() => setFilterStatus('overdue')}>En retard de paiement</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'over_limit'} onCheckedChange={() => setFilterStatus('over_limit')}>Plafond dépassé</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={filterStatus === 'is_bread_client'} onCheckedChange={() => setFilterStatus('is_bread_client')}>Clients de pain</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <SortAsc className="mr-2 h-4 w-4" />
                            Trier: {sortOptions[sortBy]}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Trier les clients par</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                            {Object.entries(sortOptions).map(([key, value]) => (
                                <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
                
                <Button variant="ghost" size="icon" onClick={refreshAll} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>

            {isManagerOrAdmin && selectedCustomers.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-primary/5 border border-primary/20 rounded-lg p-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all-customers"
                            checked={customers.length > 0 && selectedCustomers.size === customers.length}
                            onCheckedChange={handleToggleSelectAll}
                        />
                        <label htmlFor="select-all-customers" className="text-sm font-semibold text-primary">
                            {selectedCustomers.size} client(s) sélectionné(s)
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer la sélection
                        </Button>
                    </div>
                </div>
            )}
            
            <div className="min-h-[400px]">
               {renderContent()}
            </div>

            <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
                onSuccess={() => refreshAll()}
            />
            
            {isManagerOrAdmin && (
                <>
                    <DeleteCustomerDialog 
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        customer={selectedCustomer}
                        onSuccess={() => refreshAll()}
                    />
                    <DeleteMultipleCustomersDialog
                        isOpen={isBulkDeleteDialogOpen}
                        onOpenChange={setIsBulkDeleteDialogOpen}
                        customerUuids={Array.from(selectedCustomers)}
                        onSuccess={() => {
                            setSelectedCustomers(new Set());
                            refreshAll();
                        }}
                    />
                    <ImportPreviewDialog
                        isOpen={isImportPreviewOpen}
                        onOpenChange={setIsImportPreviewOpen}
                        analysis={importAnalysis}
                        onConfirm={handleConfirmImport}
                        isImporting={isImporting}
                    />
                </>
            )}

            {selectedCustomer && (
                <>
                    <AddPaymentDialog 
                        isOpen={isPaymentDialogOpen}
                        onOpenChange={setIsPaymentDialogOpen}
                        customer={selectedCustomer}
                        onPaymentSuccess={() => refreshAll()}
                    />
                    <PrintStatementDialog
                        isOpen={isStatementDialogOpen}
                        onOpenChange={setIsStatementDialogOpen}
                        customer={selectedCustomer}
                    />
                </>
            )}
        </div>
    );
}
