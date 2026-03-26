
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, ImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown, Loader2, FileUp, Trash2, LayoutGrid, List } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerTableSkeleton } from '@/components/customers/customer-table-skeleton';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { toast } from 'sonner';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { customerService } from '@/services/customer.service';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteMultipleCustomersDialog } from '@/components/customers/DeleteMultipleCustomersDialog';

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit' | 'is_bread_client';

export default function CustomersPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const searchParams = useSearchParams();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.customerViewMode,
        setViewMode: state.actions.setCustomerViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [customers, setCustomers] = useState<Customer[] | undefined>(undefined);
    const isLoading = customers === undefined;

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

    const fetchCustomers = useCallback(async () => {
        setCustomers(undefined); 
        try {
            const data = await customerService.filterCustomers({ query: debouncedSearchQuery, status: filterStatus });
            setCustomers(data);
        } catch (error: any) {
            toast.error("Impossible de charger les clients.", { description: error.message });
            setCustomers([]);
        }
    }, [debouncedSearchQuery, filterStatus]);
    
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setSelectedCustomers(new Set());
    }, [customers]);

    const handleEditCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    }, []);

    const handleDeleteCustomer = useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
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
        if (!customers) return;
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
            const analysis = await customerService.analyzeImport(file);
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
            fetchCustomers();
        } catch (error: any) {
            toast.error("Erreur lors de l'importation des données.", { description: error.message });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCSV = async () => {
        if (!customers || customers.length === 0) {
            toast.info("Aucun client à exporter.");
            return;
        }
        try {
            await customerService.exportToCSV(customers);
            toast.success("Liste des clients exportée avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de l'exportation.", { description: error.message });
        }
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return viewMode === 'grid' ? renderSkeletons() : <CustomerTableSkeleton />;
        }

        if (!customers || customers.length === 0) {
            return (
                <EmptyState
                    icon={Users}
                    title="Aucun client trouvé"
                    description="Commencez par ajouter votre premier client ou ajustez vos filtres."
                >
                     <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                    </Button>
                </EmptyState>
            );
        }
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map(c => (
                        <CustomerCard 
                            key={c.uuid} 
                            customer={c} 
                            onEdit={handleEditCustomer} 
                            onDelete={handleDeleteCustomer}
                            isSelected={selectedCustomers.has(c.uuid)}
                            onToggleSelection={() => handleToggleSelection(c.uuid)}
                        />
                    ))}
                </div>
            );
        }

        return (
            <CustomerTable 
                customers={customers}
                onEdit={handleEditCustomer}
                onDelete={(c) => {
                    setSelectedCustomer(c);
                    setIsDeleteDialogOpen(true);
                }}
                selectedCustomers={selectedCustomers}
                onToggleCustomerSelection={handleToggleSelection}
                onToggleSelectAll={handleToggleSelectAll}
            />
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Clients"
                description="Recherchez, ajoutez et gérez vos clients."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCSV} disabled={isLoading || !customers || customers.length === 0}>
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button asChild variant="outline" disabled={isAnalyzing}>
                                <label htmlFor="csv-customer-importer">
                                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                    {isAnalyzing ? 'Analyse...' : 'Importer'}
                                    <input type="file" id="csv-customer-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                                </label>
                            </Button>
                            <Button onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <CustomerStats onRefresh={fetchCustomers} />

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

                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
            </div>

            {isManagerOrAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-card border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all-customers"
                            checked={!isLoading && customers && customers.length > 0 && selectedCustomers.size === customers.length}
                            onCheckedChange={handleToggleSelectAll}
                            disabled={isLoading || !customers || customers.length === 0}
                        />
                        <label htmlFor="select-all-customers" className="text-sm font-medium">
                            {selectedCustomers.size > 0 ? `${selectedCustomers.size} sélectionné(s)` : "Tout sélectionner"}
                        </label>
                    </div>
                    {selectedCustomers.size > 0 && (
                        <div className="flex gap-2">
                            <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </Button>
                        </div>
                    )}
                </div>
            )}
            
            <div>
               {renderContent()}
            </div>

            <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />
            
            {isManagerOrAdmin && (
                <>
                    <DeleteCustomerDialog 
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        customer={selectedCustomer}
                        onSuccess={fetchCustomers}
                    />
                    <DeleteMultipleCustomersDialog
                        isOpen={isBulkDeleteDialogOpen}
                        onOpenChange={setIsBulkDeleteDialogOpen}
                        customerUuids={Array.from(selectedCustomers)}
                        onSuccess={() => {
                            setSelectedCustomers(new Set());
                            fetchCustomers();
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
        </div>
    );
}
