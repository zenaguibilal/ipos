'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Users, MoreHorizontal, Download, ChevronDown, ListFilter, FileUp, Loader2 } from 'lucide-react';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
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

export default function CustomersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('balance_desc');
    const [statusFilter, setStatusFilter] = useState('all');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const customers = useLiveQuery(() => db.customers.toArray());
    const sales = useLiveQuery(() => db.sales.toArray());
    const payments = useLiveQuery(() => db.payments.toArray());
    
    useEffect(() => {
        const savedSort = localStorage.getItem('customers_sort_option');
        if (savedSort) setSortOption(savedSort);
        const savedStatus = localStorage.getItem('customers_status_filter');
        if (savedStatus) setStatusFilter(savedStatus);
        const savedSearch = localStorage.getItem('customers_search_query');
        if (savedSearch !== null) setSearchQuery(savedSearch);
    }, []);
    
    useEffect(() => { localStorage.setItem('customers_sort_option', sortOption); }, [sortOption]);
    useEffect(() => { localStorage.setItem('customers_status_filter', statusFilter); }, [statusFilter]);
    useEffect(() => { localStorage.setItem('customers_search_query', searchQuery); }, [searchQuery]);

    const { enrichedCustomers, totalCustomers, totalDebt } = useMemo(() => {
        if (!customers || !sales || !payments) {
            return { enrichedCustomers: [], totalCustomers: 0, totalDebt: 0 };
        }

        const salesByCustomer = new Map<number, Sale[]>();
        sales.forEach(sale => {
            if (!sale.customerId) return;
            const existing = salesByCustomer.get(sale.customerId) || [];
            salesByCustomer.set(sale.customerId, [...existing, sale]);
        });

        const paymentsByCustomer = new Map<number, Payment[]>();
        payments.forEach(payment => {
            const existing = paymentsByCustomer.get(payment.customerId) || [];
            paymentsByCustomer.set(payment.customerId, [...existing, payment]);
        });
        
        let cumulativeDebt = 0;
        const customerData = customers.map((c): CustomerWithSalesData => {
            const customerSales = salesByCustomer.get(c.id!) || [];
            const customerPayments = paymentsByCustomer.get(c.id!) || [];
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            const outstandingBalance = totalSpent - totalPaid;
            cumulativeDebt += outstandingBalance;

            const allActivities = [...customerSales, ...customerPayments];
            const lastActivityDate = allActivities.length > 0
                ? allActivities.reduce((latest, act) => act.createdAt! > latest ? act.createdAt! : latest, allActivities[0].createdAt!)
                : null;
            
            const isReminderDue = outstandingBalance > 0 && c.settlementDay && lastActivityDate
                ? differenceInDays(new Date(), lastActivityDate) > c.settlementDay
                : false;

            return { ...c, id: c.id!, totalSpent, outstandingBalance, lastActivityDate, isReminderDue };
        });
        
        return { enrichedCustomers: customerData, totalCustomers: customers.length, totalDebt: cumulativeDebt };
    }, [customers, sales, payments]);

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
                    const importRowData = { firstName, lastName, phone, debtAmount, originalRow: row };
                    
                    if (existingCustomer) {
                        const phoneNeedsUpdate = phone && existingCustomer.phone !== phone;
                        const debtNeedsUpdate = debtAmount !== null && Math.abs(debtAmount - existingCustomer.outstandingBalance) > 0.01;
                        if (!phoneNeedsUpdate && !debtNeedsUpdate) {
                             skippedRows.push({ ...importRowData, reason: 'Données inchangées', existingCustomer });
                             return;
                        }
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

    const isLoading = customers === undefined || sales === undefined || payments === undefined;

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
                                <Input placeholder="Rechercher par nom ou téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                            </div>
                             <div className="flex gap-2">
                                 <Select value={sortOption} onValueChange={setSortOption}>
                                    <SelectTrigger className="w-full sm:w-[220px]"><ListFilter className="mr-2 h-4 w-4" /><SelectValue placeholder="Trier par..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="balance_desc">Solde (plus élevé)</SelectItem>
                                        <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                                        <SelectItem value="last_activity_desc">Dernière activité</SelectItem>
                                        <SelectItem value="created_asc">Date d'ajout</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <Select value={statusFilter} onValueChange={setStatusFilter}>
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
