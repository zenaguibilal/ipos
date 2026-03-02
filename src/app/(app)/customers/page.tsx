'use client';

import { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { CustomerWithSalesData, ImportAnalysis } from '@/lib/types';
import Papa from 'papaparse';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerCardSkeleton } from '@/components/customers/customer-card-skeleton';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { ImportPreviewDialog } from '@/components/customers/import-preview-dialog';

import { PlusCircle, Search, Users, Upload } from 'lucide-react';

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSalesData | null>(null);

    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    const customers = useLiveQuery(
        () => dataService.getCustomersForDisplay({ query: debouncedSearch }),
        [debouncedSearch],
        []
    );
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const analysis = await dataService.analyzeCustomerImport(results.data as any[]);
                setImportAnalysis(analysis);
                setIsImportPreviewOpen(true);
            },
            error: (error) => {
                toast.error("Erreur lors de la lecture du fichier CSV.", { description: error.message });
            }
        });

        // Reset file input
        e.target.value = '';
    };

    const handleConfirmImport = async (confirmedAnalysis: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            const result = await dataService.processCustomerImport(confirmedAnalysis);
            toast.success("Importation terminée avec succès!", {
                description: `${result.added} clients ajoutés, ${result.updated} clients mis à jour.`
            });
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
        } catch (error) {
            console.error(error);
            toast.error("Échec de l'importation.", { description: "Une erreur s'est produite lors de l'enregistrement des données." });
        } finally {
            setIsImporting(false);
        }
    };


    const handleAddClick = () => {
        setSelectedCustomer(null);
        setIsCustomerDialogOpen(true);
    };

    const handleEditClick = (customer: CustomerWithSalesData) => {
        setSelectedCustomer(customer);
        setIsCustomerDialogOpen(true);
    };

    const handleDeleteClick = (customer: CustomerWithSalesData) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    };
    
    const isLoading = customers === undefined;
    
    const sortedCustomers = useMemo(() => {
        if (!customers) return [];
        return [...customers].sort((a,b) => (b.lastActivityDate?.getTime() ?? 0) - (a.lastActivityDate?.getTime() ?? 0));
    }, [customers]);

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, text/csv"
                onChange={handleFileSelected}
            />
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Clients</h1>
                <p className="text-muted-foreground">Ajoutez, modifiez et suivez vos clients.</p>
            </header>

            <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-grow min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom ou téléphone..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button onClick={handleImportClick} variant="outline"><Upload className="mr-2 h-4 w-4"/> Importer</Button>
                <Button onClick={handleAddClick}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter un client</Button>
            </div>
            
            <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4">
                 {isLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                         {Array.from({ length: 8 }).map((_, i) => <CustomerCardSkeleton key={i} />)}
                     </div>
                 ) : sortedCustomers && sortedCustomers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sortedCustomers.map(c => (
                            <CustomerCard 
                                key={c.id} 
                                customer={c} 
                                onEdit={handleEditClick} 
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <Users className="h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">Aucun client trouvé</p>
                        <p>Essayez d'ajuster votre recherche ou ajoutez un nouveau client.</p>
                    </div>
                 )}
            </div>
            
            <CustomerDialog isOpen={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} customer={selectedCustomer} />
            <DeleteCustomerDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} customer={selectedCustomer} />
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
