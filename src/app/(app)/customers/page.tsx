
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown, Loader2, FileUp, Trash2, LayoutGrid, List, RefreshCw, SortAsc, Tags } from 'lucide-react';
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
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PrintCustomerListDialog } from '@/components/customers/PrintCustomerListDialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { CsvImporter } from '@/lib/csv-utils';

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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');
    
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [statsRefreshKey, setStatsRefreshKey] = useState(0);

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const statusFromQuery = searchParams.get('status') as FilterStatus;
        if (statusFromQuery && ['all', 'has_debt', 'overdue', 'over_limit', 'is_bread_client'].includes(statusFromQuery)) {
            setFilterStatus(statusFromQuery);
        }
        api.get<string[]>('customers/categories').then(setCategories);
    }, [searchParams]);

    const fetchCustomers = useCallback(async (isInitial = true) => {
        if (isInitial) {
            setIsLoading(true);
            setPage(1);
        }
        
        try {
            const currentPage = isInitial ? 1 : page + 1;
            const query = new URLSearchParams({
                query: debouncedSearchQuery, 
                status: filterStatus,
                category: selectedCategory,
                page: String(currentPage),
                pageSize: String(ITEMS_PER_PAGE),
                sortBy: sortBy
            }).toString();

            const result = await api.get<Customer[]>(`customers?${query}`);
            
            // Logic for "total" and "data" would normally come from API if paginated properly
            // Here we assume API Wall handles basic filtering for now
            let updatedCustomers: Customer[];
            if (isInitial) {
                updatedCustomers = result;
            } else {
                updatedCustomers = [...customers, ...result];
                setPage(currentPage);
            }
            
            setCustomers(updatedCustomers);
            setTotalCount(updatedCustomers.length); // Placeholder for actual count
            setHasMore(false); // Placeholder for actual pagination
        } catch (error: any) {
            toast.error("Impossible de charger les clients.");
            if (isInitial) setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchQuery, filterStatus, selectedCategory, page, customers, sortBy]);
    
    useEffect(() => {
        fetchCustomers(true);
    }, [debouncedSearchQuery, filterStatus, selectedCategory, sortBy]);

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const analysis = await CsvImporter.analyzeCustomers(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'analyse.");
        } finally {
            setIsAnalyzing(false);
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await api.post('customers/bulk', confirmedData);
            toast.success("Importation terminée !");
            setIsImportPreviewOpen(false);
            setStatsRefreshKey(k => k + 1);
            fetchCustomers(true);
        } catch (error: any) {
            toast.error("Erreur d'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCSV = () => {
        if (customers.length === 0) return;
        CsvImporter.exportToCSV(customers.map(c => ({
            'Nom': `${c.firstName} ${c.lastName}`,
            'Téléphone': c.phone || '',
            'Solde': c.outstandingBalance,
        })), 'customers');
    };

    const refreshAll = () => {
        setStatsRefreshKey(k => k + 1);
        fetchCustomers(true);
        api.get<string[]>('customers/categories').then(setCategories);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Gestion des Clients" description="Recherchez, ajoutez et suivez le solde de vos clients.">
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintCustomerListDialog customers={customers} title="Liste des clients" />
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
                                            Fichier CSV
                                            <input type="file" id="csv-customer-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                                        </label>
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
                        placeholder="Rechercher..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
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

            <div className="min-h-[400px]">
               {isLoading && customers.length === 0 ? <CustomerTableSkeleton /> : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {customers.map(c => <CustomerCard key={c.uuid} customer={c} onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }} isSelected={selectedCustomers.has(c.uuid)} onToggleSelection={() => {}} />)}
                       </div>
                   ) : (
                       <CustomerTable customers={customers} onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }} selectedCustomers={selectedCustomers} onToggleCustomerSelection={() => {}} onToggleSelectAll={() => {}} />
                   )
               )}
            </div>

            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} onSuccess={refreshAll} />
            {isManagerOrAdmin && <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} customer={selectedCustomer} onSuccess={refreshAll} />}
            <ImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
            {selectedCustomer && (
                <>
                    <AddPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} customer={selectedCustomer} onPaymentSuccess={refreshAll} />
                    <PrintStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} customer={selectedCustomer} />
                </>
            )}
        </div>
    );
}
