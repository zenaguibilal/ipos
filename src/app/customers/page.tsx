'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AddCustomerForm } from '@/components/customers/add-customer-form';

interface Customer {
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
                            <ul className="divide-y divide-border">
                                {customers.map(customer => (
                                    <li key={customer.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                    </li>
                                ))}
                            </ul>
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