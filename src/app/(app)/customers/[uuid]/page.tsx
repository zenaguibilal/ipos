
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2, Filter, History, ShoppingBag, TrendingUp, Info, Phone, MessageSquare, MapPin, Tag } from 'lucide-react';
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
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
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
    const companyProfile = useAppStore(state => state.profile);

    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [financialSummary, setFinancialSummary] = useState<any>(null);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

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
            const [cust, stats] = await Promise.all([
                api.get<Customer>(`customers/${customerUuid}`),
                api.get<any>(`customers/${customerUuid}/stats`)
            ]);
            
            setCustomer(cust);
            setTopProducts(stats.topProducts || []);
            setFinancialSummary(stats.financialSummary || null);
            
            if (!cust) {
                toast.error("Le client est introuvable.");
            }
        } catch (error: any) {
            toast.error("Échec du chargement des données.");
            setCustomer(null);
        }
    }, [customerUuid, router]);
    
    useEffect(() => {
        fetchCustomerData();
    },[fetchCustomerData]);

    const fetchActivity = useCallback(async (page: number, type: string) => {
        if (!customerUuid) return;
        
        setIsLoadingActivity(true);
        try {
            const allActivity = await api.get<any[]>(`customers/${customerUuid}/activity`);
            
            let filtered = allActivity;
            if (type !== 'all') {
                filtered = allActivity.filter(a => a.type === type);
            }

            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const paginated = filtered.slice(0, startIndex + ITEMS_PER_PAGE);
            
            setActivity(paginated);
            setHasMoreActivity(paginated.length < filtered.length);
        } catch (error: any) {
            toast.error("Échec de l'historique.");
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

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("Paiement enregistré.");
        await fetchCustomerData();
        setActivityPage(1);
        fetchActivity(1, filterType);
    }, [fetchCustomerData, fetchActivity, filterType]);

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const saleWithItems = await api.get<Sale>(`sales/${sale.uuid}`);
            setSelectedSale(saleWithItems);
            setIsSaleDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger la vente.");
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const returnWithItems = await api.get<ProductReturn>(`returns/${pr.uuid}`);
            setSelectedReturn(returnWithItems);
            setIsReturnDetailsOpen(true);
        } catch (error: any) {
            toast.error("Impossible de charger le retour.");
        }
    }, []);

    const handleWhatsAppReminder = () => {
        if (!customer?.phone) {
            toast.error("Numéro de téléphone manquant.");
            return;
        }
        const storeName = companyProfile?.companyName || "iPOS";
        const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (customer === undefined) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6"><Skeleton className="h-80 w-full" /></div>
                    <div className="space-y-6"><Skeleton className="h-60 w-full" /></div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return <div className="p-20 text-center"><h1 className="text-xl font-bold">Client introuvable</h1><Link href="/customers" className="text-primary underline">Retour</Link></div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild><Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link></Button>
                 <PageHeader title={`${customer.firstName} ${customer.lastName}`} description={`ID: ${customer.uuid.substring(0,8)}...`}>
                    <Badge variant="secondary"><Tag className="mr-2 h-3 w-3" />{customer.category}</Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="bg-primary/5">
                            <CardHeader className="py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" />Nombre d'achats</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-black">{financialSummary?.totalSalesCount || 0}</p><p className="text-xs text-muted-foreground">Transactions</p></CardContent>
                        </Card>
                        <Card className="bg-chart-quaternary/5">
                            <CardHeader className="py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-chart-quaternary" />Panier Moyen</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-black text-chart-quaternary">{formatCurrency(financialSummary?.averageBasketValue || 0)}</p><p className="text-xs text-muted-foreground">Valeur moyenne</p></CardContent>
                        </Card>
                    </div>

                    {customer.notes && <Card className="border-l-4 border-l-primary bg-primary/5"><CardHeader className="py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Info className="h-4 w-4 text-primary" />Notes</CardTitle></CardHeader><CardContent><p className="text-sm whitespace-pre-wrap">{customer.notes}</p></CardContent></Card>}

                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1"><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Historique</CardTitle></div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtre: {filterType}</Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')}>Tout</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')}>Ventes</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')}>Paiements</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                           {isLoadingActivity && activity.length === 0 ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : <CustomerActivity activity={activity} onSaleClick={handleSaleClick} onReturnClick={handleReturnClick} />}
                        </CardContent>
                        {hasMoreActivity && <CardFooter><Button onClick={handleLoadMore} className="w-full" variant="ghost">Charger plus</Button></CardFooter>}
                    </Card>
                </div>
                <div className="space-y-6">
                    <CustomerMetrics customer={customer} />
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setIsStatementDialogOpen(true)}><Printer className="mr-2 h-5 w-5" /> Relevé</Button>
                        <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={customer.outstandingBalance <= 0}><HandCoins className="mr-2 h-5 w-5" /> Encaisser</Button>
                    </div>
                    {customer.outstandingBalance > 0 && <Button variant="secondary" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsAppReminder}><MessageSquare className="mr-2 h-5 w-5" /> WhatsApp</Button>}
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Articles favoris</CardTitle></CardHeader>
                        <CardContent className="pt-2">{topProducts.length > 0 ? <div className="space-y-3">{topProducts.map((p: any) => <div key={p.productUuid} className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="h-8 w-8 relative rounded overflow-hidden bg-muted"><Image src={getPlaceholder().url} alt="" fill className="object-cover" /></div><p className="text-sm font-semibold">{p.name}</p></div><p className="text-sm font-bold">{p.quantity} un.</p></div>)}</div> : <p className="text-xs text-center py-4">Aucun.</p>}</CardContent>
                    </Card>
                </div>
            </div>
            
            {customer && <AddPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} customer={customer} onPaymentSuccess={handleSuccessfulPayment} />}
            <PrintStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} customer={customer} />
            <SaleDetailsDialog isOpen={isSaleDetailsOpen} onOpenChange={setIsSaleDetailsOpen} sale={selectedSale} />
            <ReturnDetailsDialog isOpen={isReturnDetailsOpen} onOpenChange={setIsReturnDetailsOpen} productReturn={selectedReturn} />
        </div>
    );
}
