'use client';

import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { customerService } from '@/services';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';

const ITEMS_PER_PAGE = 10;

export default function CustomerDetailPage() {
    const params = useParams();
    const customerUuid = params.uuid as string;

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // States for activity pagination
    const [activity, setActivity] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);

    const customer = useLiveQuery<Customer | undefined>(
        () => customerUuid ? customerService.getCustomerByUuid(customerUuid) : undefined,
        [customerUuid]
    );

    // Reset pagination when customer changes
    useEffect(() => {
        setActivity([]);
        setActivityPage(1);
        setHasMoreActivity(true);
        setIsLoadingActivity(true);
    }, [customerUuid]);

    useEffect(() => {
        if (!customer?.uuid) return;

        let isCancelled = false;
        setIsLoadingActivity(true);
        customerService.getCustomerActivity(customer.uuid, activityPage, ITEMS_PER_PAGE)
            .then(newActivity => {
                if (!isCancelled) {
                    setActivity(prev => activityPage === 1 ? newActivity : [...prev, ...newActivity]);
                    if (newActivity.length < ITEMS_PER_PAGE) {
                        setHasMoreActivity(false);
                    }
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingActivity(false);
                }
            });
        
        return () => { isCancelled = true; };
    }, [customer?.uuid, activityPage]);

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            setActivityPage(prev => prev + 1);
        }
    };

    const handleSaleClick = useCallback((sale: Sale) => {
        setSelectedSale(sale);
        setIsSaleDetailsOpen(true);
    }, []);

    const handleReturnClick = useCallback((pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsReturnDetailsOpen(true);
    }, []);

    if (customer === undefined) {
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
                           {isLoadingActivity && activity.length === 0 ? (
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
                                <Button onClick={handleLoadMore} className="w-full" disabled={isLoadingActivity}>
                                    {isLoadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            
             {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    outstandingBalance={customer.outstandingBalance}
                />
            )}

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
