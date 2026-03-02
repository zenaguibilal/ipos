'use client';

import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn } from '@/lib/types';


export default function CustomerDetailPage() {
    const params = useParams();
    const customerId = Number(params.id);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    const customer = useLiveQuery(
        () => db.customers.get(customerId),
        [customerId]
    );

    const activity = useLiveQuery(async () => {
        if (!customerId) return [];
        const sales = await db.sales.where({ customerId }).toArray();
        const payments = await db.payments.where({ customerId }).toArray();
        const returns = await db.returns.where({ customerId }).toArray();
        const combined = [...sales, ...payments, ...returns];
        return combined.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    }, [customerId], []);


    const isLoading = customer === undefined || activity === undefined;

    const handleSaleClick = (sale: Sale) => {
        setSelectedSale(sale);
        setIsSaleDetailsOpen(true);
    };

    const handleReturnClick = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsReturnDetailsOpen(true);
    };

    if (isLoading) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-60 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <h1 className="text-xl font-bold">Client non trouvé</h1>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/customers">Retour à la liste des clients</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
                    <p className="text-muted-foreground">ID Client: {customer.id}</p>
                 </div>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Historique d'activité</CardTitle>
                            <CardDescription>
                                Liste chronologique des transactions. Cliquez sur une vente ou un retour pour voir les détails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomerActivity 
                                activity={activity} 
                                onSaleClick={handleSaleClick}
                                onReturnClick={handleReturnClick}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <CustomerMetrics customer={customer} />
                    <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setIsPaymentDialogOpen(true)}
                        disabled={customer.outstandingBalance <= 0}
                    >
                        <HandCoins className="mr-2 h-5 w-5" /> Enregistrer un paiement
                    </Button>
                </div>
            </div>
            
             <AddPaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                customer={customer}
                outstandingBalance={customer.outstandingBalance}
            />

            <SaleDetailsDialog
                isOpen={isSaleDetailsOpen}
                onOpenChange={setIsSaleDetailsOpen}
                sale={selectedSale}
            />
            <ReturnDetailsDialog
                isOpen={isReturnDetailsOpen}
                onOpenChange={setIsReturnDetailsOpen}
                productReturn={selectedReturn}
            />
        </div>
    );
}
