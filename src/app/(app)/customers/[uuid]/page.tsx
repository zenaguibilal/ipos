
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2, Filter, FileText, Info, ShoppingBag, TrendingUp, History, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer, CustomerTopProduct } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';
import { returnService } from '@/services/return.service';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerUuid = params.uuid as string;

    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [topProducts, setTopProducts] = useState<CustomerTopProduct[]>([]);
    const [financialSummary, setFinancialSummary] = useState<{ totalSalesCount: number, averageBasketValue: number } | null>(null);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // States for activity pagination and filtering
    const [activity, setActivity] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    const fetchCustomerData = useCallback(async () => {
        if (!customerUuid) {
            router.push('/customers');
            return;
        }
        try {
            const [cust, topProds, summary] = await Promise.all([
                customerService.getCustomerByUuid(customerUuid),
                customerService.getCustomerTopProducts(customerUuid),
                customerService.getCustomerFinancialSummary(customerUuid)
            ]);
            
            setCustomer(cust);
            setTopProducts(topProds);
            setFinancialSummary(summary);
            
            if (!cust) {
                toast.error("Client non trouvé.");
            }
        } catch (error: any) {
            toast.error("Impossible de charger les informations du client.", { description: error.message });
            setCustomer(null);
        }
    }, [customerUuid, router]);
    
    useEffect(() => {
        fetchCustomerData();
    },[fetchCustomerData]);

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("Paiement enregistré. Mise à jour du statut du client...");
        await fetchCustomerData();
        // Reset activity
        setActivity([]);
        setActivityPage(1);
        setHasMoreActivity(true);
    }, [fetchCustomerData]);

    // Fetch activity based on page and filter
    const fetchActivity = useCallback(async (page: number, type: string) => {
        if (!customerUuid) return;
        
        setIsLoadingActivity(true);
        try {
            const allActivity = await customerService.getCustomerActivity(customerUuid, 1, 1000); // Fetch enough to filter locally for now as service doesn't support server-side filtering by type yet
            
            let filtered = allActivity;
            if (type !== 'all') {
                filtered = allActivity.filter(a => a.type === type);
            }

            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const paginated = filtered.slice(0, startIndex + ITEMS_PER_PAGE);
            
            setActivity(paginated);
            setHasMoreActivity(paginated.length < filtered.length);
        } catch (error: any) {
            toast.error("Impossible de charger l'activité du client.", { description: error.message });
        } finally {
            setIsLoadingActivity(false);
        }
    }, [customerUuid]);

    useEffect(() => {
        setActivityPage(1);
        fetchActivity(1, filterType);
    }, [customerUuid, filterType, fetchActivity]);

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            const nextPage = activityPage + 1;
            setActivityPage(nextPage);
            fetchActivity(nextPage, filterType);
        }
    };

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const saleWithItems = await salesService.getSaleByUuid(sale.uuid);
            if (!saleWithItems) {
                toast.error("Détails de la vente introuvables.");
                return;
            }
            setSelectedSale(saleWithItems);
            setIsSaleDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger les détails de la vente.", { description: error.message });
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const returnWithItems = await returnService.getReturnByUuid(pr.uuid);
             if (!returnWithItems) {
                toast.error("Détails du retour introuvables.");
                return;
            }
            setSelectedReturn(returnWithItems);
            setIsReturnDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger les détails du retour.", { description: error.message });
        }
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
                    description={`ID Client: ${customer.uuid.substring(0,8)}...`}
                 >
                    <Badge variant="secondary" className="px-3 py-1">
                        <Tag className="mr-2 h-3 w-3" />
                        {customer.category || 'Standard'}
                    </Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="bg-primary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-primary" />
                                    Nombre total d'achats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black">{financialSummary?.totalSalesCount || 0}</p>
                                <p className="text-xs text-muted-foreground">Transactions enregistrées</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-chart-quaternary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-chart-quaternary" />
                                    Panier moyen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black text-chart-quaternary">{formatCurrency(financialSummary?.averageBasketValue || 0)}</p>
                                <p className="text-xs text-muted-foreground">Valeur moyenne par visite</p>
                            </CardContent>
                        </Card>
                    </div>

                    {customer.notes && (
                        <Card className="border-l-4 border-l-primary bg-primary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    Notes & Observations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Historique d'activité
                                </CardTitle>
                                <CardDescription>
                                    Transactions chronologiques du client.
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtrer: {filterType === 'all' ? 'Tout' : filterType === 'sale' ? 'Ventes' : filterType === 'payment' ? 'Paiements' : 'Retours'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Type de transaction</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')}>Tout l'historique</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')}>Ventes uniquement</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')}>Paiements uniquement</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'return'} onCheckedChange={() => setFilterType('return')}>Retours uniquement</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                <Button onClick={handleLoadMore} className="w-full" variant="ghost" disabled={isLoadingActivity}>
                                    {isLoadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Afficher plus de résultats
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
                            variant="outline"
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
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                Articles les plus achetés
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {topProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {topProducts.map((p, i) => (
                                        <div key={p.productUuid} className="flex items-center justify-between gap-2 border-b border-muted last:border-0 pb-2 last:pb-0">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate" title={p.name}>{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.quantity} unités</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-primary">{formatCurrency(p.totalAmount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée disponible.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Informations de contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Téléphone:</span>
                                <span className="font-medium">{customer.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Adresse:</span>
                                <span className="font-medium text-right max-w-[150px]">{customer.address || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Inscrit le:</span>
                                <span className="font-medium">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
             {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={handleSuccessfulPayment}
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
