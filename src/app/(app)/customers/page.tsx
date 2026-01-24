'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Users, HandCoins, UserCheck, AlertCircle, MoreHorizontal, Download, ChevronDown, ListFilter, FileText } from 'lucide-react';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

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

    const customersWithSalesData = useMemo<CustomerWithSalesData[]>(() => {
        if (!customers || !sales || !payments) return [];
        
        const today = new Date();
        const currentDayOfMonth = today.getDate();

        return customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const customerPayments = payments.filter(p => p.customerId === customer.id);
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);

            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;
            
            const validSales = customerSales.filter(s => s.createdAt);
            const lastSaleDate = validSales.length > 0 ? Math.max(...validSales.map(s => safeToDate(s.createdAt).getTime())) : 0;
            
            const validPayments = customerPayments.filter(p => p.createdAt);
            const lastPaymentDate = validPayments.length > 0 ? Math.max(...validPayments.map(p => safeToDate(p.createdAt).getTime())) : 0;

            const lastActivityTimestamp = Math.max(lastSaleDate, lastPaymentDate);
            const lastActivityDate = lastActivityTimestamp > 0 ? new Date(lastActivityTimestamp) : null;

            let isReminderDue = false;
            if (finalBalance > 0 && customer.settlementDay) {
                if (currentDayOfMonth > customer.settlementDay) {
                    isReminderDue = true;
                }
            }

            return {
                ...customer,
                totalSpent,
                outstandingBalance: finalBalance,
                lastActivityDate,
                isReminderDue,
            };
        });
    }, [customers, sales, payments]);

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

    const { totalCustomers, totalDebt, customersWithDebt } = useMemo(() => {
        return {
            totalCustomers: customers?.length || 0,
            totalDebt: customersWithSalesData.reduce((sum, c) => sum + c.outstandingBalance, 0),
            customersWithDebt: customersWithSalesData.filter(c => c.outstandingBalance > 0).length,
        }
    }, [customers, customersWithSalesData]);


    const handleAddClick = () => {
        setSelectedCustomer(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDialogOpen(true);
    };
    
    const handleExport = () => {
        if (filteredCustomers.length === 0) {
            toast.info("Aucun client à exporter.");
            return;
        }

        const dataToExport = filteredCustomers.map(c => ({
            'Prénom': c.firstName,
            'Nom': c.lastName,
            'Téléphone': c.phone || '',
            'Dette Actuelle (DA)': c.outstandingBalance,
            'Total Dépensé (DA)': c.totalSpent,
            'Jour de Règlement': c.settlementDay || '',
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'liste_clients.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Liste des clients exportée avec succès.");
    };

    const isLoading = isUserLoading || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des clients...</p></div>;
    }

    return (
        <>
            <CustomerDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
                userId={user.uid}
            />
             <DeleteCustomerDialog
                isOpen={!!customerToDelete}
                onOpenChange={(isOpen) => !isOpen && setCustomerToDelete(null)}
                customer={customerToDelete}
                userId={user.uid}
            />
            {customerForPayment && (
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
                                <Button variant="outline">
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter en CSV
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
                         {filteredCustomers.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {customers && customers.length > 0 ? "Aucun client ne correspond à votre recherche." : "Aucun client trouvé. Commencez par en ajouter un."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Téléphone</TableHead>
                                            <TableHead className="text-right">Dette</TableHead>
                                            <TableHead className="text-right">Total Dépensé</TableHead>
                                            <TableHead>Dernière Activité</TableHead>
                                            <TableHead className="text-center">Jour de règlement</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCustomers.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/customers/${customer.id}`} className="hover:underline">
                                                        {`${customer.firstName} ${customer.lastName}`}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{customer.phone || 'N/A'}</TableCell>
                                                <TableCell className="text-right font-semibold text-destructive">{customer.outstandingBalance.toFixed(1)} DA</TableCell>
                                                <TableCell className="text-right">{customer.totalSpent.toFixed(1)} DA</TableCell>
                                                <TableCell>{customer.lastActivityDate ? format(customer.lastActivityDate, 'd MMM yyyy', { locale: fr }) : 'N/A'}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {customer.settlementDay || 'N/A'}
                                                        {customer.isReminderDue && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>La date de règlement est dépassée.</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/customers/${customer.id}`}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Voir les détails
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setCustomerForPayment(customer)}>
                                                                <HandCoins className="mr-2 h-4 w-4" />
                                                                Encaisser un paiement
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditClick(customer)}>Modifier</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setCustomerToDelete(customer)} className="text-destructive">Supprimer</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </main>
        </>
    )
}
