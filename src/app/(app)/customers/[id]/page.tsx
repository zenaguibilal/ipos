'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HandCoins, UserX } from 'lucide-react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import Link from 'next/link';

export default function CustomerDetailPage() {
    const params = useParams();
    const customerId = params.id ? parseInt(params.id as string, 10) : NaN;
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const customerData = useLiveQuery(
        () => isNaN(customerId) ? null : dataService.getCustomerDetails(customerId),
        [customerId]
    );

    const isLoading = customerData === undefined;
    const customer = customerData?.customer;
    const activity = customerData?.activity || [];
    
    if (isLoading) {
        return (
            <div className="p-4 sm:p-6">
                <Skeleton className="h-10 w-1/2 mb-6" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-center h-full">
                <UserX className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">Client non trouvé</h1>
                <p className="text-muted-foreground">Le client que vous recherchez n'existe pas ou a été supprimé.</p>
                <Button asChild variant="outline" className="mt-6">
                    <Link href="/customers">Retour à la liste des clients</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <AddPaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                customer={customer}
                outstandingBalance={customer.outstandingBalance}
            />
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{customer.firstName} {customer.lastName}</h1>
                        <p className="text-muted-foreground">{customer.phone || "Aucun numéro de téléphone"}</p>
                    </div>
                    <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={customer.outstandingBalance <= 0}>
                        <HandCoins className="mr-2 h-4 w-4" /> Enregistrer un paiement
                    </Button>
                </header>

                <div className="grid md:grid-cols-3 gap-6 flex-grow overflow-hidden">
                    <div className="md:col-span-1 space-y-6 overflow-y-auto">
                        <CustomerMetrics customer={customer} />
                    </div>
                    <div className="md:col-span-2 flex flex-col min-h-0">
                         <Card className="flex-grow flex flex-col min-h-0">
                            <CardHeader>
                                <CardTitle>Historique d'activité</CardTitle>
                                <CardDescription>Liste chronologique des ventes et paiements.</CardDescription>
                            </CardHeader>
                             <CardContent className="flex-grow overflow-y-auto">
                                <CustomerActivity activity={activity} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
