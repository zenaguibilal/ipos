
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { EditCustomerForm } from '@/components/customers/edit-customer-form';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
}

export default function CustomersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

    const customersCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'customers');
    }, [user, firestore]);

    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const handleDeleteCustomer = () => {
        if (!deletingCustomer || !firestore || !user) return;
        const customerDocRef = doc(firestore, 'users', user.uid, 'customers', deletingCustomer.id);
        deleteDocumentNonBlocking(customerDocRef, {
            onSuccess: () => setDeletingCustomer(null),
            onError: (err) => console.error("Failed to delete customer:", err)
        });
    }

    if (isUserLoading || !user) {
        return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>;
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
           
            <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
                <Card className="w-full max-w-4xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Clients</CardTitle>
                            <CardDescription>Gérez votre liste de clients.</CardDescription>
                        </div>
                        <Button onClick={() => setIsAddingCustomer(true)}>Ajouter un client</Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingCustomers ? (
                            <div className="text-center">Chargement des clients...</div>
                        ) : customers && customers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">E-mail</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Téléphone</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {customers.map(customer => (
                                            <tr key={customer.id}>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium">{customer.firstName} {customer.lastName}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{customer.email || '-'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{customer.phone || '-'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeletingCustomer(customer)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
            </div>
        </>
    );
}

