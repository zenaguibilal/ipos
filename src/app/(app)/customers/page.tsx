
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, User, Phone, CircleDollarSign, CalendarDays } from 'lucide-react';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import type { Customer, Sale, Payment } from '@/lib/types';
import Link from 'next/link';

interface CustomerWithSalesData extends Customer {
    totalSpent: number;
    outstandingBalance: number;
}

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

    const customersWithData = useMemo<CustomerWithSalesData[]>(() => {
        if (!customers || !sales || !payments) return [];

        const salesByCustomer = new Map<string, number>();
        sales.forEach(sale => {
            if (sale.customerId) {
                salesByCustomer.set(sale.customerId, (salesByCustomer.get(sale.customerId) || 0) + sale.total);
            }
        });

        const paymentsByCustomer = new Map<string, number>();
        payments.forEach(payment => {
            if (payment.customerId) {
                paymentsByCustomer.set(payment.customerId, (paymentsByCustomer.get(payment.customerId) || 0) + payment.amount);
            }
        });
        
        const unpaidSalesByCustomer = new Map<string, number>();
        sales.forEach(sale => {
            if (sale.customerId) {
                unpaidSalesByCustomer.set(sale.customerId, (unpaidSalesByCustomer.get(sale.customerId) || 0) + sale.remainingBalance);
            }
        });


        return customers.map(customer => {
            const totalSpent = salesByCustomer.get(customer.id) || 0;
            const totalPaidFromSales = sales.filter(s => s.customerId === customer.id).reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = paymentsByCustomer.get(customer.id) || 0;
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;

            return {
                ...customer,
                totalSpent,
                outstandingBalance: outstandingBalance < 0.01 ? 0 : outstandingBalance, // Avoid small negative numbers
            };
        });

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
                    <Input 
                        placeholder="Rechercher un client par nom ou téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-sm"
                    />
                    <Button onClick={() => setIsAddingCustomer(true)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un client
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center">Chargement des données...</div>
                ) : filteredCustomers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredCustomers.map(customer => (
                            <Link href={`/customers/${customer.id}`} key={customer.id} passHref>
                                <Card className="cursor-pointer hover:shadow-md hover:border-primary transition-all group p-4 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
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
