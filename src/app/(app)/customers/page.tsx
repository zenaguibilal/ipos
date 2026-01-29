'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Users, HandCoins, UserCheck, AlertCircle, MoreHorizontal, Download, ChevronDown, ListFilter, FileText, FileUp, Loader2 } from 'lucide-react';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { calculateAllCustomersMetrics } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CustomerCard } from '@/components/customers/customer-card';
import { CustomerCardSkeleton } from '@/components/customers/customer-card-skeleton';

export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [customerForPayment, setCustomerForPayment] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('debt_desc');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Data fetching
    const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'customers'), orderBy('lastName', 'asc')) : null, [user, firestore]);
    const salesQuery = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'payments')) : null, [user, firestore]);

    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { customersWithSalesData, totalDebt, customersWithDebt } = useMemo(() => {
        if (!customers || !sales || !payments) {
            return { customersWithSalesData: [], totalDebt: 0, customersWithDebt: 0 };
        }
        return calculateAllCustomersMetrics(customers, sales, payments);
    }, [customers, sales, payments]);

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
                case 'debt_desc':
                    return b.outstandingBalance - a.outstandingBalance;
                case 'spent_desc':
                    return b.totalSpent - a.totalSpent;
                case 'activity_desc':
                    const timeB = b.lastActivityDate?.getTime() || 0;
                    const timeA = a.lastActivityDate?.getTime() || 0;
                    return timeB - timeA;
                case 'name_asc':
                    return a.lastName.localeCompare(b.lastName);
                default:
                    return 0;
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
    
    const handleExportDebts = () => {
        const customersWithDebtToExport = customersWithSalesData.filter(c => c.outstandingBalance > 0);
        if (customersWithDebtToExport.length === 0) {
            toast.info("Aucun client avec une dette à exporter.");
            return;
        }

        const dataToExport = customersWithDebtToExport.map(c => ({
            'Nom du client': `${c.firstName} ${c.lastName}`,
            'Dette (DA)': c.outstandingBalance.toFixed(2),
            'Téléphone': c.phone || '',
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'dettes_clients.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Liste des dettes clients exportée avec succès.");
    };

    const handleImportClick = () => {
        if (isImporting) return;
        fileInputRef.current?.click();
    };

    const parseCustomerName = (fullName: string): { firstName: string, lastName: string } => {
        if (!fullName) return { firstName: 'Inconnu', lastName: '' };
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts.shift() || '';
        const lastName = parts.join(' ');
        return { firstName, lastName };
    }

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        toast.info("Importation des clients en cours... Veuillez patienter.");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (!firestore || !user) {
                    toast.error("Erreur d'authentification.");
                    setIsImporting(false);
                    return;
                }

                const requiredHeaders = ['Nom du client', 'Dette (DA)'];
                const headers = results.meta.fields || [];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    toast.error(`Fichier CSV invalide. En-têtes manquants: ${missingHeaders.join(', ')}`);
                    setIsImporting(false);
                    if(event.target) event.target.value = '';
                    return;
                }
                
                const existingCustomerNames = new Set(
                    customers?.map(c => `${c.firstName.trim()} ${c.lastName.trim()}`.toLowerCase())
                );
                
                const customersToImport = results.data as { 'Nom du client': string; 'Dette (DA)': string; 'Téléphone'?: string }[];
                let importedCount = 0;
                let errorCount = 0;
                let skippedCount = 0;

                const chunkSize = 400; 
                for (let i = 0; i < customersToImport.length; i += chunkSize) {
                    const chunk = customersToImport.slice(i, i + chunkSize);
                    const batch = writeBatch(firestore);

                    chunk.forEach((row) => {
                        const fullName = row['Nom du client'];
                        const debtString = row['Dette (DA)'];
                        const phone = row['Téléphone'] || '';
    
                        if (!fullName || typeof fullName !== 'string' || !debtString) {
                            errorCount++;
                            return;
                        }
                        
                        const { firstName, lastName } = parseCustomerName(fullName);
                        const normalizedFullName = `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
                        
                        if (existingCustomerNames.has(normalizedFullName)) {
                            skippedCount++;
                            return;
                        }

                        const debtAmount = parseFloat(debtString.replace(',', '.'));
                        if (isNaN(debtAmount) || debtAmount <= 0) {
                            return;
                        }
                        
                        const newCustomerRef = doc(collection(firestore, 'users', user.uid, 'customers'));
                        batch.set(newCustomerRef, {
                            firstName,
                            lastName,
                            createdAt: serverTimestamp(),
                            phone: phone,
                        });
                        
                        const newSaleRef = doc(collection(firestore, 'users', user.uid, 'sales'));
                        batch.set(newSaleRef, {
                            invoiceNumber: `DEBT-IMPORT-${Date.now()}-${newCustomerRef.id}`,
                            items: [{
                                id: 'imported-debt',
                                name: 'Solde initial importé',
                                price: debtAmount,
                                purchasePrice: 0,
                                quantity: 1,
                            }],
                            subtotal: debtAmount,
                            total: debtAmount,
                            amountPaid: 0,
                            remainingBalance: debtAmount,
                            paymentStatus: 'unpaid',
                            payments: [],
                            customerId: newCustomerRef.id,
                            customerName: `${firstName} ${lastName}`,
                            createdAt: serverTimestamp(),
                        });
    
                        importedCount++;
                        existingCustomerNames.add(normalizedFullName);
                    });
                    
                    try {
                       await batch.commit();
                    } catch (err) {
                       console.error("Error during batch commit:", err);
                       toast.error("Une erreur s'est produite lors d'un lot d'importation. Certains clients pourraient ne pas avoir été importés.");
                       setIsImporting(false);
                       if(event.target) event.target.value = '';
                       return;
                    }
                }

                if (importedCount > 0) {
                    toast.success(`${importedCount} client(s) importé(s) avec succès.`);
                }
                if (skippedCount > 0) {
                    toast.info(`${skippedCount} client(s) ont été ignorés car ils existent déjà.`);
                }
                if (errorCount > 0) {
                    toast.warning(`${errorCount} ligne(s) ont été ignorées en raison de données manquantes.`);
                }
                if(importedCount === 0 && skippedCount === 0 && errorCount === 0) {
                    toast.info("Aucun nouveau client avec une dette à importer n'a été trouvé dans le fichier.");
                }

                setIsImporting(false);
                if(event.target) event.target.value = '';
            },
            error: (error) => {
                console.error("CSV Parsing error:", error);
                toast.error("Erreur lors de la lecture du fichier CSV.");
                setIsImporting(false);
            }
        });
    };

    const isLoading = isUserLoading || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (!user && !isLoading) {
        return <div className="flex h-full items-center justify-center"><p>Redirection...</p></div>;
    }

    return (
        <>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} accept=".csv" />
            {user && <CustomerDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
                userId={user.uid}
            />}
             {user && <DeleteCustomerDialog
                isOpen={!!customerToDelete}
                onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}
                customer={customerToDelete}
                userId={user.uid}
            />}
            {customerForPayment && user && (
                <AddPaymentForm
                    isOpen={!!customerForPayment}
                    onOpenChange={(isOpen) => !isOpen && setCustomerForPayment(null)}
                    customer={customerForPayment}
                    userId={user.uid}
                />
            )}
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
                                    Actions 
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportDebts} disabled={isImporting}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter les Dettes (CSV)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleImportClick} disabled={isImporting}>
                                    <FileUp className="mr-2 h-4 w-4" /> Importer les Dettes (CSV)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un client
                        </Button>
                    </div>
                </div>
                 <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clients Totaux</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCustomers}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dettes Totales</CardTitle>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{totalDebt.toFixed(1)} DA</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clients avec Dettes</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{customersWithDebt}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par nom ou téléphone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-full sm:w-[220px]">
                                    <ListFilter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Trier par..." />
                                </SelectTrigger>
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
                                    <CustomerCard
                                        key={customer.id}
                                        customer={customer}
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
