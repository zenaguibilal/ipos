'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileDown, RefreshCw, LayoutGrid, List } from 'lucide-react';
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
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { CsvImporter } from '@/lib/csv-utils';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { customers, isLoading } = useAppStore(state => ({
        customers: state.customers,
        isLoading: state.isLoading.customers
    }));
    const { refreshCustomers } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        refreshCustomers();
    }, [refreshCustomers]);

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const analysis = await CsvImporter.analyzeCustomers(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur d'analyse.");
        } finally {
            event.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await api.post('customers/bulk', confirmedData);
            toast.success("Importation terminée !");
            setIsImportPreviewOpen(false);
            refreshCustomers();
        } catch (error: any) {
            toast.error("Erreur d'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Gestion des Clients" description="Recherchez, ajoutez et suivez le solde de vos clients.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => CsvImporter.exportCustomers(customers)}>Exporter CSV</Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button asChild variant="outline">
                                <label className="cursor-pointer">
                                    Importer
                                    <input type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
                                </label>
                            </Button>
                            <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <CustomerStats />

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
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-5 w-5"/></Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => refreshCustomers()} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>

            <div className="min-h-[400px]">
               {isLoading && customers.length === 0 ? <CustomerTableSkeleton /> : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredCustomers.map(c => <CustomerCard key={c.uuid} customer={c} onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }} isSelected={false} onToggleSelection={() => {}} />)}
                       </div>
                   ) : (
                       <CustomerTable customers={filteredCustomers} onEdit={(c) => { setSelectedCustomer(c); setIsCustomerDialogOpen(true); }} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteDialogOpen(true); }} onPayment={(c) => { setSelectedCustomer(c); setIsPaymentDialogOpen(true); }} onStatement={(c) => { setSelectedCustomer(c); setIsStatementDialogOpen(true); }} selectedCustomers={new Set()} onToggleCustomerSelection={() => {}} onToggleSelectAll={() => {}} />
                   )
               )}
            </div>

            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} onSuccess={() => refreshCustomers()} />
            {isManagerOrAdmin && <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} customer={selectedCustomer} onSuccess={() => refreshCustomers()} />}
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
