
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, History, ShoppingBag, TrendingUp, Info, MessageSquare, Tag, CreditCard, Star, Calendar } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

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
        const storeName = companyProfile?.companyName || "iPOS Authority";
        const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci de régulariser dès que possible.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const customer = selectedCustomer.data;
    const activity = selectedCustomer.activity;
    const stats = selectedCustomer.stats;

    if (isLoading && !customer) {
        return (
             <div className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto">
                <Skeleton className="h-12 w-48 rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-8 mt-10">
                    <div className="md:col-span-2 space-y-8"><Skeleton className="h-96 w-full rounded-[3rem]" /></div>
                    <div className="space-y-8"><Skeleton className="h-[500px] w-full rounded-[3rem]" /></div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <Info className="h-20 w-20 text-muted-foreground opacity-20" />
                <h1 className="text-2xl font-black uppercase tracking-widest italic opacity-40">Client introuvable</h1>
                <Button asChild variant="outline" className="rounded-2xl h-12 px-10 font-bold uppercase"><Link href="/customers">Retour au registre</Link></Button>
            </div>
        );
    }

    const filteredActivity = filterType === 'all' ? activity : activity.filter(a => a.type === filterType);

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                    <Button variant="outline" size="icon" asChild className="rounded-2xl h-14 w-14 luxury-glass border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-lg">
                        <Link href="/customers"><ArrowLeft className="h-6 w-6" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{customer.firstName} <span className="text-primary">{customer.lastName}</span></h1>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className="px-4 py-1.5 font-black uppercase text-[9px] tracking-widest bg-primary/10 text-primary border-primary/20">
                                <Tag className="mr-2 h-3 w-3" /> {customer.category}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold opacity-60">ID: {customer.uuid.substring(0,8)}</span>
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" onClick={() => setIsStatementDialogOpen(true)} className="flex-1 md:flex-none h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest luxury-glass border-white/10 px-8 gap-2">
                        <Printer className="h-4 w-4" /> Relevé A4
                    </Button>
                    <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={customer.outstandingBalance <= 0} className="flex-1 md:flex-none h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 px-8 gap-2">
                        <CreditCard className="h-4 w-4" /> Encaisser
                    </Button>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics & History */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card className="luxury-glass border-primary/10 bg-primary/5 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <ShoppingBag className="h-24 w-24 rotate-12" />
                            </div>
                            <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Volume d'opérations</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-primary opacity-50" />
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-4xl font-black tracking-tighter">{stats?.financialSummary?.totalSalesCount || 0}</p>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-primary" />
                                    Transactions validées sur le terminal
                                </p>
                            </CardContent>
                        </Card>
                        
                        <Card className="luxury-glass border-chart-quaternary/10 bg-chart-quaternary/5 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                <Star className="h-24 w-24 rotate-12" />
                            </div>
                            <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-chart-quaternary">Score de Panier</CardTitle>
                                <Star className="h-4 w-4 text-chart-quaternary opacity-50" />
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-4xl font-black tracking-tighter text-chart-quaternary">{formatCurrency(stats?.financialSummary?.averageBasketValue || 0)}</p>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-chart-quaternary" />
                                    Valeur moyenne par ticket iPOS
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {customer.notes && (
                        <Card className="border-l-4 border-l-primary bg-primary/5 rounded-[1.5rem] overflow-hidden">
                            <CardHeader className="py-4 px-6"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary"><Info className="h-4 w-4" />Notes de commandement</CardTitle></CardHeader>
                            <CardContent className="px-6 pb-6"><p className="text-sm font-bold leading-relaxed">{customer.notes}</p></CardContent>
                        </Card>
                    )}

                     <Card className="luxury-glass border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-8 border-b border-white/5 bg-white/5">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tighter italic">
                                    <History className="h-6 w-6 text-primary animate-pulse" />
                                    Grand Livre des Flux
                                </CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Historique chronologique des transactions</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest luxury-glass border-white/10 hover:bg-primary/10">Filtre: {filterType}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[160px]">
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')} className="font-bold py-2">Tout les flux</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')} className="font-bold py-2">Ventes uniquement</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')} className="font-bold py-2">Versements Reçus</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'return'} onCheckedChange={() => setFilterType('return')} className="font-bold py-2">Retours Marchandise</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-8">
                           {isLoading ? (
                               <div className="flex flex-col justify-center items-center py-20 gap-4 opacity-30">
                                   <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">Récupération des archives...</p>
                               </div>
                           ) : (
                               <CustomerActivity activity={filteredActivity} onSaleClick={handleSaleClick} onReturnClick={handleReturnClick} />
                           )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Profile Stats & Reminders */}
                <div className="space-y-8">
                    <CustomerMetrics customer={customer} />
                    
                    {customer.outstandingBalance > 0 && (
                        <div className="animate-in zoom-in-95 duration-500">
                            <Button variant="secondary" className="w-full h-16 rounded-[1.5rem] bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-green-600/20 group gap-3" onClick={handleWhatsAppReminder}>
                                <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                                Relance WhatsApp
                            </Button>
                            <p className="text-[9px] text-center mt-3 text-muted-foreground font-bold uppercase tracking-widest opacity-50 italic">Génère un message de solde automatique</p>
                        </div>
                    )}

                    <Card className="luxury-glass border-white/5 rounded-[2.5rem] overflow-hidden group">
                        <CardHeader className="p-6 border-b border-white/5 bg-white/5">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                Articles Stratégiques (Top 5)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats?.topProducts?.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {stats.topProducts.map((p: any) => (
                                        <div key={p.productUuid} className="flex items-center justify-between p-5 hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 relative rounded-xl overflow-hidden bg-muted border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                                                    <Image src={getPlaceholder().url} alt="" fill className="object-cover" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">{p.name}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Consommation régulière</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black h-6 px-3 rounded-lg text-[10px]">
                                                {p.quantity} Un.
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 opacity-30 grayscale space-y-4">
                                    <ShoppingBag className="h-10 w-10" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun flux détecté</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-[2.5rem] bg-muted/10 border border-white/5 flex flex-col items-center text-center space-y-4">
                        <Calendar className="h-6 w-6 text-muted-foreground opacity-40" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Membre depuis</p>
                            <p className="text-sm font-black mt-1 uppercase italic">{new Date(customer.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <AddPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} customer={customer} onPaymentSuccess={handleSuccessfulPayment} />
            <PrintStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} customer={customer} />
            <SaleDetailsDialog isOpen={isSaleDetailsOpen} onOpenChange={setIsSaleDetailsOpen} sale={selectedSale} />
            <ReturnDetailsDialog isOpen={isReturnDetailsOpen} onOpenChange={setIsReturnDetailsOpen} productReturn={selectedReturn} />
        </div>
    );
}
