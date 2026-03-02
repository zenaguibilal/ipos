'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Users, MoreHorizontal, Download, ChevronDown, ListFilter, FileUp, Loader2 } from 'lucide-react';
import type { Customer, CustomerWithSalesData } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { format, differenceInDays } from 'date-fns';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerCardSkeleton } from '@/components/customers/customer-card-skeleton';
import { ImportPreviewDialog, type ImportAnalysis } from '@/components/customers/import-preview-dialog';
import { useDebounce } from '@/hooks/useDebounce';
import useSWR from 'swr';


export default function CustomersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);

    const { data: searchQuery, mutate: setSearchQuery } = useSWR('customers_search_query', async () => (await dataService.getSetting('customers_search_query'))?.value || '', { revalidateOnFocus: false });
    const { data: sortOption, mutate: setSortOption } = useSWR('customers_sort_option', async () => (await dataService.getSetting('customers_sort_option'))?.value || 'balance_desc', { revalidateOnFocus: false });
    const { data: statusFilter, mutate: setStatusFilter } = useSWR('customers_status_filter', async () => (await dataService.getSetting('customers_status_filter'))?.value || 'all', { revalidateOnFocus: false });

    const handleSearchChange = (value: string) => {
        setSearchQuery(value, false);
        dataService.setSetting('customers_search_query', value);
    };
    const handleSortChange = (value: string) => {
        setSortOption(value, false);
        dataService.setSetting('customers_sort_option', value);
    };
    const handleStatusChange = (value: string) => {
        setStatusFilter(value, false);
        dataService.setSetting('customers_status_filter', value);
    };

    const debouncedSearchQuery = useDebounce(searchQuery || '', 300);

    const customers = useLiveQuery(() => db.customers.toArray());
    
    const { enrichedCustomers, totalCustomers, totalDebt } = useMemo(() => {
        if (!customers) {
            return { enrichedCustomers: [], totalCustomers: 0, totalDebt: 0 };
        }
        
        let cumulativeDebt = 0;
        const customerData: CustomerWithSalesData[] = customers.map((c) => {
            cumulativeDebt += c.outstandingBalance;
            const isReminderDue = c.outstandingBalance > 0 && c.settlementDay && c.lastActivityDate
                ? differenceInDays(new Date(), c.lastActivityDate) > c.settlementDay
                : false;
            return { ...c, id: c.id!, isReminderDue };
        });
        
        return { enrichedCustomers: customerData, totalCustomers: customers.length, totalDebt: cumulativeDebt };
    }, [customers]);

    const existingCustomersMap = useMemo(() => new Map(
        enrichedCustomers?.map(c => [`${c.firstName.trim()} ${c.lastName.trim()}`.toLowerCase(), c])
    ), [enrichedCustomers]);

    const filteredCustomers = useMemo(() => {
        if (!enrichedCustomers) return [];
        
        let tempCustomers = debouncedSearchQuery ? enrichedCustomers.filter(c =>
            c.firstName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            c.lastName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(debouncedSearchQuery))
        ) : enrichedCustomers;

        if (statusFilter === 'with_debt') {
            tempCustomers = tempCustomers.filter(c => c.outstandingBalance > 0);
        } else if (statusFilter === 'no_debt') {
            tempCustomers = tempCustomers.filter(c => c.outstandingBalance <= 0);
        } else if (statusFilter === 'reminder_due') {
            tempCustomers = tempCustomers.filter(c => c.isReminderDue);
        }
        
        tempCustomers.sort((a, b) => {
            switch (sortOption) {
                case 'name_asc': return a.lastName.localeCompare(b.lastName);
                case 'balance_desc': return b.outstandingBalance - a.outstandingBalance;
                case 'last_activity_desc': return (b.lastActivityDate?.getTime() || 0) - (a.lastActivityDate?.getTime() || 0);
                case 'created_asc': return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
                default: return 0;
            }
        });

        return tempCustomers;
    }, [enrichedCustomers, debouncedSearchQuery, sortOption, statusFilter]);

    const handleAddClick = () => {
        setSelectedCustomer(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDialogOpen(true);
    };
    
    const handleExportCustomers = () => {
        if (!enrichedCustomers || enrichedCustomers.length === 0) {
            toast.info("Aucun client à exporter.");
            return;
        }

        const dataToExport = enrichedCustomers.map(c => ({
            'Prénom': c.firstName, 'Nom': c.lastName, 'Téléphone': c.phone || '',
            'Dernière activité': c.lastActivityDate ? format(c.lastActivityDate, 'yyyy-MM-dd') : '',
            'Solde impayé': c.outstandingBalance, 'Total dépensé': c.totalSpent,
            'Client depuis le': c.createdAt ? format(c.createdAt, 'yyyy-MM-dd') : '',
        }));
        
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'export_clients_complets.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Liste complète des clients exportée avec succès.");
    };

    const handleImportClick = () => {
        if (isImporting) return;
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().trim().replace(/\s+/g, ''),
            complete: (results) => {
                const headers = (results.meta.fields || []).map(h => h.toLowerCase().trim().replace(/\s+/g, ''));
                const hasFullName = headers.includes('nomduclient');
                const hasFirstAndLastName = headers.includes('prénom') && headers.includes('nom');
                if (!hasFullName && !hasFirstAndLastName) {
                    toast.error("Fichier CSV invalide. En-têtes de nom requis : ('Nom du client') ou ('Prénom' et 'Nom').");
                    if(event.target) event.target.value = '';
                    return;
                }

                const customersToAdd: any[] = []; const customersToUpdate: any[] = [];
                const skippedRows: any[] = []; const errorRows: any[] = [];
                const customersToImport = results.data as any[];
    
                customersToImport.forEach((row) => {
                    let firstName, lastName;
                    if(hasFirstAndLastName) {
                        firstName = row['prénom']; lastName = row['nom'];
                    } else {
                        const parts = String(row['nomduclient'] || '').trim().split(/\s+/);
                        firstName = parts.shift() || ''; lastName = parts.join(' ');
                    }
                    if (!firstName && !lastName) { errorRows.push({ ...row, reason: 'Nom manquant' }); return; }
                    if (!firstName) firstName = ''; if (!lastName) lastName = '';
    
                    const phone = row['téléphone'] || '';
                    const debtAmount = row['soldeimpayé'] !== undefined ? parseFloat(String(row['soldeimpayé']).replace(',', '.')) : null;

                    const normalizedFullName = `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
                    const existingCustomer = existingCustomersMap.get(normalizedFullName);
                    const importRowData = { firstName, lastName, phone, debtAmount: debtAmount ?? 0, originalRow: row };
                    
                    if (existingCustomer) {
                         customersToUpdate.push({ ...importRowData, existingCustomer });
                    } else {
                        customersToAdd.push(importRowData);
                    }
                });
    
                setImportAnalysis({ customersToAdd, customersToUpdate, skippedRows, errorRows, totalRows: customersToImport.length });
                setIsImportPreviewOpen(true);
            },
            error: (error) => { console.error("CSV Parsing error:", error); toast.error("Erreur lors de la lecture du fichier CSV."); }
        });
        if(event.target) event.target.value = '';
    };

    const executeImport = async (confirmedAnalysis: ImportAnalysis) => {
        if (!confirmedAnalysis) { toast.error("Aucune donnée à importer."); return; }
        setIsImporting(true); setIsImportPreviewOpen(false);
        toast.info("Importation des clients en cours... Veuillez patienter.");

        try {
            const { importedCount, updatedCount } = await dataService.importCustomers(confirmedAnalysis);
            if (importedCount > 0) toast.success(`${importedCount} nouveau(x) client(s) importé(s) avec succès.`);
            if (updatedCount > 0) toast.success(`${updatedCount} client(s) existant(s) mis à jour.`);
            if (importedCount === 0 && updatedCount === 0) toast.info("Aucune action d'importation n'a été effectuée.");
        } catch (error: any) {
            console.error("Error during import execution:", error);
            toast.error(error.message || "Une erreur s'est produite lors de l'importation.");
        } finally {
            setIsImporting(false);
            setImportAnalysis(null);
        }
    };

    const isLoading = customers === undefined || searchQuery === undefined || sortOption === undefined || statusFilter === undefined;

    return (
        <>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} accept=".csv" />
            <CustomerDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} customer={selectedCustomer} />
            <DeleteCustomerDialog isOpen={!!customerToDelete} onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)} customer={customerToDelete} />
            <ImportPreviewDialog 
                isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}
                analysis={importAnalysis} onConfirm={executeImport} isImporting={isImporting}
            />
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
                        <p className="text-muted-foreground">Suivez vos clients, leurs achats et leurs dettes.</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isImporting}>
                                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportCustomers} disabled={isImporting}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter les Clients (CSV)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
                                    <FileUp className="mr-2 h-4 w-4" /> Importer des Clients (CSV)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un client
                        </Button>
                    </div>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clients Totaux</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalCustomers}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dettes Totales</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{totalDebt.toFixed(1)} DA</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par nom ou téléphone..." value={searchQuery || ''} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 w-full" />
                            </div>
                             <div className="flex gap-2">
                                 <Select value={sortOption} onValueChange={handleSortChange}>
                                    <SelectTrigger className="w-full sm:w-[220px]"><ListFilter className="mr-2 h-4 w-4" /><SelectValue placeholder="Trier par..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="balance_desc">Solde (plus élevé)</SelectItem>
                                        <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                                        <SelectItem value="last_activity_desc">Dernière activité</SelectItem>
                                        <SelectItem value="created_asc">Date d'ajout</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={statusFilter} onValueChange={handleStatusChange}>
                                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les clients</SelectItem>
                                        <SelectItem value="with_debt">Avec dette</SelectItem>
                                        <SelectItem value="no_debt">Sans dette</SelectItem>
                                        <SelectItem value="reminder_due">Rappel requis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <CustomerCardSkeleton key={i} />)}
                            </div>
                         ) : filteredCustomers.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {customers && customers.length > 0 ? "Aucun client ne correspond à vos filtres." : "Aucun client trouvé. Commencez par en ajouter un."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredCustomers.map((customer) => (
                                    <CustomerCard key={customer.id} customer={customer}
                                        onEdit={() => handleEditClick(customer)}
                                        onDelete={setCustomerToDelete}
                                    />
                                ))}
                            </div>
                         )}
                    </CardContent>
                </Card>
            </main>
        </>
    )
}
