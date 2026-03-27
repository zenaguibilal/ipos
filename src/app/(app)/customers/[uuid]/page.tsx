
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2, History, ShoppingBag, TrendingUp, Info, MessageSquare, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAppStore, useAppActions } from '@/stores/appStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomerDetailPage() {
    const params = useParams();
    const customerUuid = params.uuid as string;
    
    const { selectedCustomer, isLoading, companyProfile } = useAppStore(state => ({
        selectedCustomer: state.selectedCustomer,
        isLoading: state.isLoading.customerDetail,
        companyProfile: state.profile
    }));
    const { fetchCustomerDetails } = useAppActions();

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        if (customerUuid) fetchCustomerDetails(customerUuid);
    }, [customerUuid, fetchCustomerDetails]);

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("Paiement enregistré.");
        fetchCustomerDetails(customerUuid);
    }, [customerUuid, fetchCustomerDetails]);

    const handleSaleClick = useCallback(async (sale: Sale) => {
        setSelectedSale(sale);
        setIsSaleDetailsOpen(true);
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsReturnDetailsOpen(true);
    }, []);

    const handleWhatsAppReminder = () => {
        const customer = selectedCustomer.data;
        if (!customer?.phone) {
            toast.error("Numéro de téléphone manquant.");
            return;
        }
        const storeName = companyProfile?.companyName || "iPOS";
        const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const customer = selectedCustomer.data;
    const activity = selectedCustomer.activity;
    const stats = selectedCustomer.stats;

    if (isLoading && !customer) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-12 w-48 rounded-xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6"><Skeleton className="h-80 w-full rounded-2xl" /></div>
                    <div className="space-y-6"><Skeleton className="h-60 w-full rounded-2xl" /></div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return <div className="p-20 text-center"><h1 className="text-xl font-bold">Client introuvable</h1><Link href="/customers" className="text-primary underline">Retour</Link></div>;
    }

    const filteredActivity = filterType === 'all' ? activity : activity.filter(a => a.type === filterType);

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild className="rounded-xl"><Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link></Button>
                 <PageHeader title={`${customer.firstName} ${customer.lastName}`} description={`ID: ${customer.uuid.substring(0,8)}...`}>
                    <Badge variant="secondary" className="px-3 py-1 font-bold"><Tag className="mr-2 h-3 w-3" />{customer.category}</Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="luxury-glass border-primary/10 bg-primary/5">
                            <CardHeader className="py-3"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><ShoppingBag className="h-4 w-4" />Volume d'achats</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-black">{stats?.financialSummary?.totalSalesCount || 0}</p><p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Transactions totales</p></CardContent>
                        </Card>
                        <Card className="luxury-glass border-chart-quaternary/10 bg-chart-quaternary/5">
                            <CardHeader className="py-3"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-chart-quaternary"><TrendingUp className="h-4 w-4" />Panier Moyen</CardTitle></CardHeader>
                            <CardContent><p className="text-3xl font-black text-chart-quaternary">{formatCurrency(stats?.financialSummary?.averageBasketValue || 0)}</p><p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Valeur moyenne ticket</p></CardContent>
                        </Card>
                    </div>

                    {customer.notes && <Card className="border-l-4 border-l-primary bg-primary/5"><CardHeader className="py-3"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><Info className="h-4 w-4" />Notes de profil</CardTitle></CardHeader><CardContent><p className="text-sm font-medium whitespace-pre-wrap">{customer.notes}</p></CardContent></Card>}

                     <Card className="luxury-glass border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight text-sm"><History className="h-5 w-5 text-primary" />Historique des Flux</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="rounded-xl h-8 text-[10px] font-black uppercase">Filtre: {filterType}</Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="luxury-glass">
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')}>Tout</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')}>Ventes</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')}>Paiements</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'return'} onCheckedChange={() => setFilterType('return')}>Retours</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="pt-6">
                           {isLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : <CustomerActivity activity={filteredActivity} onSaleClick={handleSaleClick} onReturnClick={handleReturnClick} />}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <CustomerMetrics customer={customer} />
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setIsStatementDialogOpen(true)} className="h-12 rounded-xl font-bold luxury-glass border-white/10"><Printer className="mr-2 h-5 w-5" /> Relevé</Button>
                        <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={customer.outstandingBalance <= 0} className="h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"><HandCoins className="mr-2 h-5 w-5" /> Encaisser</Button>
                    </div>
                    {customer.outstandingBalance > 0 && <Button variant="secondary" className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleWhatsAppReminder}><MessageSquare className="mr-2 h-5 w-5" /> Rappel WhatsApp</Button>}
                    <Card className="luxury-glass border-white/5">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" />Articles Favoris</CardTitle></CardHeader>
                        <CardContent className="pt-2">
                            {stats?.topProducts?.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.topProducts.map((p: any) => (
                                        <div key={p.productUuid} className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 relative rounded-lg overflow-hidden bg-muted">
                                                    <Image src={getPlaceholder().url} alt="" fill className="object-cover" />
                                                </div>
                                                <p className="text-xs font-bold truncate max-w-[100px]">{p.name}</p>
                                            </div>
                                            <p className="text-xs font-black text-primary">{p.quantity} un.</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-[10px] text-center py-8 text-muted-foreground italic font-medium uppercase">Aucune donnée disponible</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <AddPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} customer={customer} onPaymentSuccess={handleSuccessfulPayment} />
            <PrintStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} customer={customer} />
            <SaleDetailsDialog isOpen={isSaleDetailsOpen} onOpenChange={setIsSaleDetailsOpen} sale={selectedSale} />
            <ReturnDetailsDialog isOpen={isReturnDetailsOpen} onOpenChange={setIsReturnDetailsOpen} productReturn={selectedReturn} />
        </div>
    );
}
