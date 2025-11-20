
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { EditCustomerForm } from '@/components/customers/edit-customer-form';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { SettleDebtDialog } from '@/components/customers/settle-debt-dialog';
import { MoreHorizontal, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';


export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [settlingDebtForCustomer, setSettlingDebtForCustomer] = useState<CustomerWithSalesData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Customers
    const customersCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'customers');
    }, [user, firestore]);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);

    // Fetch Sales
    const salesCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'sales');
    }, [user, firestore]);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    
    // Fetch Payments
    const paymentsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'payments');
    }, [user, firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);
    
    // Combine customer and sales data
    const customersWithSales = useMemo(() => {
        if (!customers || !sales || !payments) return [];

        const salesByCustomer = sales.reduce((acc, sale) => {
            if (sale.customerId) {
                if (!acc[sale.customerId]) {
                    acc[sale.customerId] = { totalSpent: 0, debtFromSales: 0 };
                }
                acc[sale.customerId].totalSpent += sale.total;
                acc[sale.customerId].debtFromSales += sale.remainingBalance;
            }
            return acc;
        }, {} as Record<string, { totalSpent: number, debtFromSales: number }>);

        const paymentsByCustomer = payments.reduce((acc, payment) => {
             if (payment.customerId) {
                if (!acc[payment.customerId]) {
                    acc[payment.customerId] = 0;
                }
                acc[payment.customerId] += payment.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        return customers.map(customer => {
            const customerSales = salesByCustomer[customer.id] || { totalSpent: 0, debtFromSales: 0 };
            const customerPayments = paymentsByCustomer[customer.id] || 0;
            const outstandingBalance = customerSales.debtFromSales - customerPayments;

            return {
                ...customer,
                totalSpent: customerSales.totalSpent,
                outstandingBalance: outstandingBalance > 0 ? outstandingBalance : 0,
            }
        });
    }, [customers, sales, payments]);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customersWithSales;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        
        return customersWithSales.filter(customer => 
            customer.firstName.toLowerCase().includes(lowercasedQuery) ||
            customer.lastName.toLowerCase().includes(lowercasedQuery)
        );
    }, [customersWithSales, searchQuery]);


    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const handleDeleteCustomer = () => {
        if (!deletingCustomer || !firestore || !user) return;
        const customerDocRef = doc(firestore, 'users', user.uid, 'customers', deletingCustomer.id);
        deleteDocumentNonBlocking(customerDocRef, {
            onSuccess: () => {
                setDeletingCustomer(null);
                toast.success(`Le client "${deletingCustomer.firstName} ${deletingCustomer.lastName}" a été supprimé.`);
            },
            onError: (err) => {
                console.error("Failed to delete customer:", err);
                toast.error("Échec de la suppression du client.");
            }
        });
    }

    const handleSettleDebt = (amount: number) => {
        if (!settlingDebtForCustomer || !firestore || !user) return;

        const paymentsRef = collection(firestore, 'users', user.uid, 'payments');
        addDocumentNonBlocking(paymentsRef, {
            amount: amount,
            customerId: settlingDebtForCustomer.id,
            customerName: `${settlingDebtForCustomer.firstName} ${settlingDebtForCustomer.lastName}`,
            createdAt: serverTimestamp(),
        }, {
            onSuccess: () => {
                setSettlingDebtForCustomer(null);
                toast.success(`Paiement de ${amount.toFixed(2)} DA enregistré pour ${settlingDebtForCustomer.firstName} ${settlingDebtForCustomer.lastName}.`);
            },
            onError: (err) => {
                console.error("Failed to add payment:", err);
                toast.error("Échec de l'enregistrement du paiement.");
            }
        })
    };
    
    const isLoading = isUserLoading || isLoadingCustomers || isLoadingSales || isLoadingPayments;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <AddCustomerForm 
                isOpen={isAddingCustomer}
                onOpenChange={setIsAddingCustomer}
                userId={user.uid}
            />
            {editingCustomer && (
                 <EditCustomerForm
                    isOpen={!!editingCustomer}
                    onOpenChange={(isOpen) => !isOpen && setEditingCustomer(null)}
                    userId={user.uid}
                    customer={editingCustomer}
                />
            )}
            {deletingCustomer && (
                <DeleteCustomerDialog
                    isOpen={!!deletingCustomer}
                    onOpenChange={(isOpen) => !isOpen && setDeletingCustomer(null)}
                    onConfirm={handleDeleteCustomer}
                    customerName={`${deletingCustomer.firstName} ${deletingCustomer.lastName}`}
                />
            )}
            {settlingDebtForCustomer && (
                <SettleDebtDialog
                    isOpen={!!settlingDebtForCustomer}
                    onOpenChange={(isOpen) => !isOpen && setSettlingDebtForCustomer(null)}
                    onConfirm={handleSettleDebt}
                    customerName={`${settlingDebtForCustomer.firstName} ${settlingDebtForCustomer.lastName}`}
                    outstandingBalance={settlingDebtForCustomer.outstandingBalance}
                />
            )}
           
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between pt-4">
                        <Input 
                            placeholder="Rechercher par nom ou prénom..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm"
                        />
                         <Button onClick={() => setIsAddingCustomer(true)}>Ajouter un client</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : filteredCustomers && filteredCustomers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Téléphone</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Jour de règlement</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Dépensé</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde Impayé</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredCustomers.map(customer => (
                                            <tr key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer hover:bg-muted/50">
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{customer.firstName} {customer.lastName}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{customer.phone || '-'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{customer.settlementDay || '-'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{customer.totalSpent.toFixed(2)} DA</td>
                                                <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${customer.outstandingBalance > 0 ? 'text-destructive' : ''}`}>{customer.outstandingBalance.toFixed(2)} DA</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setSettlingDebtForCustomer(customer)} disabled={customer.outstandingBalance <= 0}>
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                                <span>Régler la dette</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Modifier</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeletingCustomer(customer)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : customers && customers.length > 0 && searchQuery ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">Aucun client ne correspond à votre recherche.</p>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Vous n'avez pas encore de clients.</p>
                                    <Button variant="link" onClick={() => setIsAddingCustomer(true)}>Ajouter votre premier client</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}
