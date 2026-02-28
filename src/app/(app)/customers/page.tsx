'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Users, HandCoins, UserCheck, AlertCircle, MoreHorizontal, Download, ChevronDown, ListFilter, FileText, FileUp, Loader2 } from 'lucide-react';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { calculateAllCustomersMetrics, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerCardSkeleton } from '@/components/customers/customer-card-skeleton';
import { ImportPreviewDialog, type ImportAnalysis } from '@/components/customers/import-preview-dialog';

export default function CustomersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('debt_desc');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);

    const customers = useLiveQuery(() => db.customers.toArray());
    const sales = useLiveQuery(() => db.sales.toArray());
    const payments = useLiveQuery(() => db.payments.toArray());

    useEffect(() => {
        const savedSortOption = localStorage.getItem('customers_sort_option');
        if (savedSortOption) setSortOption(savedSortOption);
        const savedSearch = localStorage.getItem('customers_search_query');
        if (savedSearch !== null) setSearchQuery(savedSearch);
    }, []);

    useEffect(() => { localStorage.setItem('customers_sort_option', sortOption); }, [sortOption]);
    useEffect(() => { localStorage.setItem('customers_search_query', searchQuery); }, [searchQuery]);

    const { customersWithSalesData, totalDebt, customersWithDebt } = useMemo(() => {
        if (!customers || !sales || !payments) {
            return { customersWithSalesData: [], totalDebt: 0, customersWithDebt: 0 };
        }
        return calculateAllCustomersMetrics(customers, sales, payments);
    }, [customers, sales, payments]);

    const existingCustomersMap = useMemo(() => new Map(
        customersWithSalesData.map(c => [`${c.firstName.trim()} ${c.lastName.trim()}`.toLowerCase(), c])
    ), [customersWithSalesData]);

    const totalCustomers = customers?.length || 0;

    const filteredCustomers = useMemo(() => {
        if (!customersWithSalesData) return [];
        
        let tempCustomers = customersWithSalesData.filter(c =>
            c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(searchQuery))
        );

        tempCustomers.sort((a, b) => {
            switch (sortOption) {
                case 'debt_desc': return b.outstandingBalance - a.outstandingBalance;
                case 'spent_desc': return b.totalSpent - a.totalSpent;
                case 'activity_desc': return (b.lastActivityDate?.getTime() || 0) - (a.lastActivityDate?.getTime() || 0);
                case 'name_asc': return a.lastName.localeCompare(b.lastName);
                default: return 0;
            }
        });

        return tempCustomers;
    }, [customersWithSalesData, searchQuery, sortOption]);

    const handleAddClick = () => {
        setSelectedCustomer(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDialogOpen(true);
    };
    
    const handleExportCustomers = () => {
        if (customersWithSalesData.length === 0) {
            toast.info("Aucun client à exporter.");
            return;
        }

        const dataToExport = customersWithSalesData.map(c => ({
            'Prénom': c.firstName, 'Nom': c.lastName, 'Téléphone': c.phone || '',
            'Jour de règlement': c.settlementDay || '',
            'Client depuis le': c.createdAt ? format(safeToDate(c.createdAt), 'yyyy-MM-dd') : '',
            'Dette Actuelle (DA)': c.outstandingBalance.toFixed(2),
            'Total Dépensé (DA)': c.totalSpent.toFixed(2),
            'Dernière Activité': c.lastActivityDate ? format(c.lastActivityDate, 'yyyy-MM-dd') : '',
        }));
        
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'export_clients.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Liste des clients exportée avec succès.");
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
            transformHeader: header => header.toLowerCase().trim(),
            complete: (results) => {
                const headers = (results.meta.fields || []).map(h => h.toLowerCase().trim());
                const hasFullName = headers.includes('nom du client');
                const hasFirstAndLastName = headers.includes('prénom') && headers.includes('nom');
                if (!hasFullName && !hasFirstAndLastName) {
                    toast.error("Fichier CSV invalide. En-têtes de nom requis : ('Nom du client') ou ('Prénom' et 'Nom').");
                    if(event.target) event.target.value = '';
                    return;
                }
                const hasDebt = headers.includes('dette (da)') || headers.includes('dette actuelle (da)');
                const customersToAdd: any[] = []; const customersToUpdate: any[] = [];
                const skippedRows: any[] = []; const errorRows: any[] = [];
                const customersToImport = results.data as any[];
    
                customersToImport.forEach((row) => {
                    let firstName, lastName;
                    if(hasFirstAndLastName) {
                        firstName = row['prénom']; lastName = row['nom'];
                    } else {
                        const parts = String(row['nom du client'] || '').trim().split(/\s+/);
                        firstName = parts.shift() || ''; lastName = parts.join(' ');
                    }
                    if (!firstName && !lastName) { errorRows.push({ ...row, reason: 'Nom manquant' }); return; }
                    if (!firstName) firstName = ''; if (!lastName) lastName = '';
    
                    let debtAmount: number | null = null;
                    if (hasDebt) {
                        const debtStringRaw = row['dette actuelle (da)'] || row['dette (da)'];
                        if (debtStringRaw !== null && debtStringRaw !== undefined && String(debtStringRaw).trim() !== '') {
                            const parsedAmount = parseFloat(String(debtStringRaw).replace(',', '.'));
                            if (!isNaN(parsedAmount)) debtAmount = parsedAmount;
                        }
                    }
                    const phone = row['téléphone'] || '';
                    let settlementDay: number | undefined;
                    const rawSettlementDay = row['jour de règlement'] || '';
                    if (rawSettlementDay) {
                        const parsedDay = parseInt(String(rawSettlementDay), 10);
                        if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) settlementDay = parsedDay;
                    }
                    const normalizedFullName = `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
                    const existingCustomer = existingCustomersMap.get(normalizedFullName);
                    const importRowData = { firstName, lastName, phone, settlementDay, debtAmount, originalRow: row };
                    
                    if (existingCustomer) {
                        const debtNeedsUpdate = debtAmount !== null;
                        const phoneNeedsUpdate = phone && existingCustomer.phone !== phone;
                        const settlementDayNeedsUpdate = settlementDay !== undefined && existingCustomer.settlementDay !== settlementDay;
                        if (!debtNeedsUpdate && !phoneNeedsUpdate && !settlementDayNeedsUpdate) {
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
            {customerForPayment && (
                <AddPaymentForm isOpen={!!customerForPayment} onOpenChange={(isOpen) => !isOpen && setCustomerForPayment(null)} customer={customerForPayment} />
            )}
            <ImportPreviewDialog 
                isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}
                analysis={importAnalysis} onConfirm={executeImport} isImporting={isImporting}
            />
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Clients</h1>
                        <p className="text-muted-foreground">Suivez vos clients et leurs dettes.</p>
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
                 <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clients Totaux</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalCustomers}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dettes Totales</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{totalDebt.toFixed(1)} DA</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clients avec Dettes</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{customersWithDebt}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par nom ou téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                            </div>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-full sm:w-[220px]"><ListFilter className="mr-2 h-4 w-4" /><SelectValue placeholder="Trier par..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="debt_desc">Dette la plus élevée</SelectItem>
                                    <SelectItem value="spent_desc">Total dépensé</SelectItem>
                                    <SelectItem value="activity_desc">Activité la plus récente</SelectItem>
                                    <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    {customers && customers.length > 0 ? "Aucun client ne correspond à votre recherche." : "Aucun client trouvé. Commencez par en ajouter un."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredCustomers.map((customer) => (
                                    <CustomerCard key={customer.id} customer={customer}
                                        onEdit={() => handleEditClick(customer)}
                                        onDelete={setCustomerToDelete}
                                        onAddPayment={setCustomerForPayment}
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
