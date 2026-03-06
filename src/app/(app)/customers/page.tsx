'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer, CustomerWithSalesData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, FileDown, Filter } from 'lucide-react';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerCardSkeleton } from '@/components/customers/customer-card-skeleton';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { ImportAnalysis } from '@/lib/types';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type FilterStatus = 'all' | 'has_debt' | 'overdue' | 'over_limit';

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const customers = useLiveQuery<CustomerWithSalesData[]>(
        () => dataService.getCustomers({ query: debouncedSearchQuery, status: filterStatus }),
        [debouncedSearchQuery, filterStatus],
        []
    );
    
    const isLoading = customers === undefined;

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    };

    const handleDeleteCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const analysis = await dataService.analyzeCustomerImport(results.data);
                    setImportAnalysis(analysis);
                    setIsImportPreviewOpen(true);
                },
                error: (error) => {
                    toast.error("Erreur lors de l'analyse du fichier CSV.", { description: error.message });
                }
            });
        }
        if (e.target) e.target.value = '';
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await dataService.processCustomerImport(confirmedData.toAdd, confirmedData.toUpdate);
            toast.success("Importation des clients terminée avec succès !");
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
        } catch (error) {
            console.error("Customer import failed:", error);
            toast.error("Une erreur est survenue lors de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };
    
    const renderSkeletons = () => (
        [...Array(6)].map((_, i) => <CustomerCardSkeleton key={i} />)
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletons()}
                </div>
            );
        }

        if (customers.length === 0) {
            return (
                <div className="text-center py-16">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mt-4">Aucun client trouvé</h3>
                    <p className="text-muted-foreground mt-2">Commencez par ajouter votre premier client ou ajustez vos filtres.</p>
                     <Button className="mt-4" onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un client
                    </Button>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map(c => (
                    <CustomerCard 
                        key={c.id} 
                        customer={c} 
                        onEdit={handleEditCustomer} 
                        onDelete={handleDeleteCustomer}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Clients</h1>
                    <p className="text-muted-foreground">Recherchez, ajoutez et gérez vos clients.</p>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <label htmlFor="csv-importer">
                            <FileDown className="mr-2 h-4 w-4" /> Importer
                            <input type="file" id="csv-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => { setSelectedCustomer(null); setIsCustomerDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
            </header>

            <CustomerStats customers={customers} isLoading={isLoading} />

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
                            <Filter className="mr-2 h-4 w-4" />
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
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div>
               {renderContent()}
            </div>

            <CustomerDialog 
                isOpen={isCustomerDialogOpen}
                onOpenChange={setIsCustomerDialogOpen}
                customer={selectedCustomer}
            />
            <DeleteCustomerDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                customer={selectedCustomer}
            />
            <ImportPreviewDialog
                isOpen={isImportPreviewOpen}
                onOpenChange={setIsImportPreviewOpen}
                analysis={importAnalysis}
                onConfirm={handleConfirmImport}
                isImporting={isImporting}
            />
        </div>
    );
}
