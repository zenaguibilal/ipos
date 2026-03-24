'use client';

import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { db } from '@/lib/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useMemo } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer, Payment } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';

const ITEMS_PER_PAGE = 10;

export default function CustomerDetailPage() {
    const params = useParams();
    const customerId = Number(params.id);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // States for activity pagination
    const [activityPage, setActivityPage] = useState(1);

    const customer = useLiveQuery<Customer | undefined>(
        () => !isNaN(customerId) ? dataService.getCustomerById(customerId) : undefined,
        [customerId]
    );
    const allActivity = useLiveQuery(() => 
        !isNaN(customerId) ? dataService.getCustomerActivity(customerId) : undefined,
        [customerId]
    );

    const activity = useMemo(() => {
        if (!allActivity) return [];
        return allActivity.slice(0, activityPage * ITEMS_PER_PAGE);
    }, [allActivity, activityPage]);

    const hasMoreActivity = allActivity ? activity.length < allActivity.length : false;

    const isLoading = customer === undefined;
    const isLoadingActivity = allActivity === undefined;


    const handleLoadMore = () => {
        setActivityPage(prev => prev + 1);
    };

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
                           {isLoadingActivity ? (
                                <div className="flex justify-center items-center h-60">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <CustomerActivity 
                                    activity={activity} 
                                    onSaleClick={handleSaleClick}
                                    onReturnClick={handleReturnClick}
                                />
                            )}
                        </CardContent>
                        {hasMoreActivity && (
                            <CardFooter>
                                <Button onClick={handleLoadMore} className="w-full">
                                    Charger plus
                                </Button>
                            </CardFooter>
                        )}
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
                onOpenChange={setIsPaymentDialogOpen}
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
