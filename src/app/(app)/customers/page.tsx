
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, User, Phone, WalletCards, CalendarDays, AlertTriangle, Search } from 'lucide-react';
import { AddCustomerForm } from './add-customer-form';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isAfter, getDate } from 'date-fns';

export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Data Fetching ---
    const customersQuery = useMemoFirebase(() => 
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'customers'), orderBy('lastName', 'asc')) : null, 
    [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);

    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { customersWithData, totalOutstandingDebt } = useMemo(() => {
        if (!customers || !sales || !payments) return { customersWithData: [], totalOutstandingDebt: 0 };

        const today = new Date();
        const currentDayOfMonth = getDate(today);

        let totalDebt = 0;

        const customerData = customers.map(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            
            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = payments.filter(p => p.customerId === customer.id).reduce((acc, p) => acc + p.amount, 0);
            
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;
            
            totalDebt += finalBalance;

            let isReminderDue = false;
            if (customer.settlementDay && finalBalance > 0) {
                 // Check if today is past the settlement day for this month
                if (currentDayOfMonth > customer.settlementDay) {
                    isReminderDue = true;
                }
            }

            return {
                ...customer,
                totalSpent,
                outstandingBalance: finalBalance,
                isReminderDue,
            };
        });

        return { customersWithData: customerData, totalOutstandingDebt: totalDebt };

    }, [customers, sales, payments]);
    
    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customersWithData;
        const lowercasedQuery = searchQuery.toLowerCase();
        return customersWithData.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowercasedQuery) ||
            c.phone?.includes(lowercasedQuery)
        );
    }, [customersWithData, searchQuery]);

    const isLoading = isUserLoading || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des clients...</p></div>;
    }

    return (
        <>
            <AddCustomerForm 
                isOpen={isAddingCustomer}
                onOpenChange={setIsAddingCustomer}
                userId={user.uid}
            />
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher un client..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                    </div>
                    <Button onClick={() => setIsAddingCustomer(true)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un client
                    </Button>
                </div>
                
                 <Card className="mb-6 bg-destructive/10 border-destructive/50">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <WalletCards className="h-6 w-6 text-destructive" />
                            <div>
                                <h3 className="font-bold text-base">Total des Dettes Clients</h3>
                                <p className="text-xs text-muted-foreground">Montant total que vos clients vous doivent.</p>
                            </div>
                        </div>
                         <div className="text-2xl font-black text-destructive">
                            {totalOutstandingDebt.toFixed(2)} DA
                        </div>
                    </div>
                 </Card>


                {isLoading ? (
                    <div className="text-center">Chargement des données...</div>
                ) : filteredCustomers.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredCustomers.map(customer => (
                            <Link href={`/customers/${customer.id}`} key={customer.id} passHref>
                                <Card className={cn(
                                    "cursor-pointer hover:shadow-md hover:border-primary transition-all group p-4 flex flex-col justify-between h-full",
                                    customer.isReminderDue && "bg-destructive/10 border-destructive/50 hover:border-destructive"
                                    )}>
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                 <div className="bg-muted rounded-full h-12 w-12 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg leading-tight">{customer.firstName} {customer.lastName}</h3>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                            <Phone className="h-3 w-3"/>
                                                            <span>{customer.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {customer.isReminderDue && (
                                                <div className="text-destructive" title="Paiement en retard">
                                                    <AlertTriangle className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                         {customer.settlementDay && (
                                             <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                                <CalendarDays className="h-3 w-3" />
                                                <span>Jour de règlement : le {customer.settlementDay} de chaque mois</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t pt-3 mt-3 space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Total Dépensé</span>
                                            <span className="font-semibold">{customer.totalSpent.toFixed(2)} DA</span>
                                        </div>
                                         <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Solde Actuel</span>
                                            <span className={`font-bold ${customer.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>{customer.outstandingBalance.toFixed(2)} DA</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                     <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                        <div className="text-center">
                            <p className="text-muted-foreground">
                                {customers && customers.length > 0 ? "Aucun client ne correspond à votre recherche." : "Vous n'avez pas encore de clients."}
                            </p>
                             {customers && customers.length === 0 && (
                                <Button variant="link" onClick={() => setIsAddingCustomer(true)}>Ajouter votre premier client</Button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
