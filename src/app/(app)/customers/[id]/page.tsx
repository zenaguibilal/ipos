'use client';

import { useParams } from 'next/navigation';
import { dataService } from '@/services/data-service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useEffect, useCallback } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer, GlobalActivityItem } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';


export default function CustomerDetailPage() {
    const params = useParams();
    const customerId = Number(params.id);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    const [customer, setCustomer] = useState<Customer | undefined>(undefined);
    const [activity, setActivity] = useState<GlobalActivityItem[] | undefined>(undefined);

    const loadData = useCallback(async () => {
        if (isNaN(customerId)) return;
        const [customerData, activityData] = await Promise.all([
            dataService.getCustomerById(customerId),
            dataService.getCustomerActivity(customerId),
        ]);
        setCustomer(customerData);
        setActivity(activityData);
    }, [customerId]);

    useEffect(() => {
        loadData();
    }, [loadData]);


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
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <PageHeader 
                    title={`${customer.firstName} ${customer.lastName}`}
                    description={`ID Client: ${customer.id}`}
                 />
            </div>

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
                                activity={activity || []} 
                                onSaleClick={handleSaleClick}
                                onReturnClick={handleReturnClick}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <CustomerMetrics customer={customer} />
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            size="lg" 
                            className="w-full"
                            onClick={() => setIsStatementDialogOpen(true)}
                        >
                            <Printer className="mr-2 h-5 w-5" /> Relevé
                        </Button>
                        <Button 
                            size="lg" 
                            className="w-full"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="mr-2 h-5 w-5" /> Paiement
                        </Button>
                    </div>
                </div>
            </div>
            
             <AddPaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={(open) => {
                    setIsPaymentDialogOpen(open);
                    if (!open) loadData();
                }}
                customer={customer}
                outstandingBalance={customer.outstandingBalance}
            />

            <PrintStatementDialog
                isOpen={isStatementDialogOpen}
                onOpenChange={setIsStatementDialogOpen}
                customer={customer}
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
