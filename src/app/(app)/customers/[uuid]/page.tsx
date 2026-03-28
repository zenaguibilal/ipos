
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Loader2, History, ShoppingBag, TrendingUp, Info, MessageSquare, Tag, CreditCard, Star, Calendar, ShoppingCart, Target } from 'lucide-react';
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

/**
 * @fileOverview Customer Command Center (Finalized Excellence)
 * المركز السيادي للتحكم في حساب الزبون، الديون، وتتبع النشاط التجاري.
 */

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
        toast.success("Versement enregistré dans le Cloud.");
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
            toast.error("Numéro de téléphone absent du profil.");
            return;
        }
        const storeName = companyProfile?.companyName || "iPOS Authority";
        const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci de régulariser à votre convenance.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const customer = selectedCustomer.data;
    const activity = selectedCustomer.activity;
    const stats = selectedCustomer.stats;

    if (isLoading && !customer) {
        return (
             <div className="p-4 sm:p-6 space-y-10 max-w-screen-2xl mx-auto">
                <div className="flex items-center gap-6"><Skeleton className="h-14 w-14 rounded-2xl" /><Skeleton className="h-12 w-64 rounded-xl" /></div>
                <div className="grid lg:grid-cols-3 gap-8 mt-10">
                    <div className="lg:col-span-2 space-y-8"><Skeleton className="h-40 w-full rounded-[2.5rem]" /><Skeleton className="h-[600px] w-full rounded-[2.5rem]" /></div>
                    <div className="space-y-8"><Skeleton className="h-[500px] w-full rounded-[2.5rem]" /></div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <Info className="h-24 w-24 text-muted-foreground opacity-10" />
                <h1 className="text-3xl font-black uppercase tracking-tighter italic opacity-30">Compte introuvable</h1>
                <Button asChild variant="outline" className="rounded-2xl h-14 px-12 font-black uppercase tracking-widest luxury-glass border-white/10 hover:bg-primary/10 transition-all">
                    <Link href="/customers">Retour au Registre</Link>
                </Button>
            </div>
        );
    }

    const filteredActivity = filterType === 'all' ? activity : activity.filter(a => a.type === filterType);

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <Star className="h-64 w-64 rotate-12" />
                 </div>
                 
                 <div className="flex items-center gap-8 relative z-10">
                    <Button variant="outline" size="icon" asChild className="rounded-2xl h-16 w-16 luxury-glass border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-xl hover:-translate-x-1">
                        <Link href="/customers"><ArrowLeft className="h-7 w-7" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="px-4 py-1 font-black uppercase text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20 shadow-inner">
                                <Tag className="mr-2 h-3.5 w-3.5" /> {customer.category}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold opacity-40">SOVEREIGN_ID: {customer.uuid.substring(0,8)}</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">{customer.firstName} <span className="text-primary">{customer.lastName}</span></h1>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                    <Button variant="outline" onClick={() => setIsStatementDialogOpen(true)} className="flex-1 md:flex-none h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] luxury-glass border-white/10 px-10 gap-3 hover:bg-white/5 transition-all">
                        <Printer className="h-5 w-5 opacity-60" /> Relevé A4
                    </Button>
                    <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={customer.outstandingBalance <= 0} className="flex-1 md:flex-none h-16 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 px-12 gap-3 hover:scale-105 active:scale-95 transition-all">
                        <CreditCard className="h-5 w-5" /> Encaisser
                    </Button>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Analytics & Ledger */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="grid sm:grid-cols-2 gap-8">
                        <Card className="luxury-glass border-primary/10 bg-primary/5 group relative overflow-hidden transition-all duration-500 hover:border-primary/30">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-all pointer-events-none group-hover:scale-110">
                                <ShoppingBag className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="py-5 px-8 border-b border-white/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/70">Volume d'opérations</CardTitle>
                                <ShoppingCart className="h-4.5 w-4.5 text-primary opacity-40" />
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="flex items-baseline gap-3">
                                    <p className="text-5xl font-black tracking-tighter">{stats?.financialSummary?.totalSalesCount || 0}</p>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Transactions</p>
                                </div>
                                <div className="flex items-center gap-3 mt-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Flux validés sur ce terminal</p>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="luxury-glass border-chart-quaternary/10 bg-chart-quaternary/5 group relative overflow-hidden transition-all duration-500 hover:border-chart-quaternary/30">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-all pointer-events-none group-hover:scale-110">
                                <Star className="h-32 w-32 rotate-12" />
                            </div>
                            <CardHeader className="py-5 px-8 border-b border-white/5 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-chart-quaternary/70">Score de Panier</CardTitle>
                                <Star className="h-4.5 w-4.5 text-chart-quaternary opacity-40" />
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="flex items-baseline gap-3">
                                    <p className="text-5xl font-black tracking-tighter text-chart-quaternary">{formatCurrency(stats?.financialSummary?.averageBasketValue || 0)}</p>
                                    <p className="text-[10px] font-black uppercase text-chart-quaternary/40">Moyenne</p>
                                </div>
                                <div className="flex items-center gap-3 mt-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <Target className="h-4 w-4 text-chart-quaternary" />
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Valeur moyenne par ticket iPOS</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {customer.notes && (
                        <Card className="border-l-4 border-l-primary bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl animate-in slide-in-from-left-4 duration-700">
                            <CardHeader className="py-5 px-8"><CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary"><Info className="h-4 w-4" />Notes de commandement</CardTitle></CardHeader>
                            <CardContent className="px-8 pb-8"><p className="text-sm font-bold leading-relaxed text-foreground/80 italic">"{customer.notes}"</p></CardContent>
                        </Card>
                    )}

                     <Card className="luxury-glass border-white/5 rounded-[3rem] overflow-hidden shadow-2xl bg-muted/5">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-10 border-b border-white/5 bg-white/[0.03]">
                            <div>
                                <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter italic">
                                    <History className="h-8 w-8 text-primary animate-pulse" />
                                    Grand Livre des Flux
                                </CardTitle>
                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-60">Audit chronologique des interactions</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-2xl h-12 px-8 text-[10px] font-black uppercase tracking-widest luxury-glass border-white/10 hover:bg-primary/10 transition-all gap-3 shadow-md">
                                        Filtre: {filterType === 'all' ? 'Tout les flux' : filterType}
                                        <History className="h-3.5 w-3.5 opacity-40" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[200px] shadow-2xl border-white/10">
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')} className="font-black py-3 px-4 rounded-xl uppercase text-[10px] tracking-widest">Tout les flux</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')} className="font-black py-3 px-4 rounded-xl uppercase text-[10px] tracking-widest text-primary">Ventes uniquement</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')} className="font-black py-3 px-4 rounded-xl uppercase text-[10px] tracking-widest text-chart-quaternary">Versements Reçus</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'return'} onCheckedChange={() => setFilterType('return')} className="font-black py-3 px-4 rounded-xl uppercase text-[10px] tracking-widest text-destructive">Retours Marchandise</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="p-10">
                           {isLoading ? (
                               <div className="flex flex-col justify-center items-center py-24 gap-6 opacity-30">
                                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                   <p className="text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Extraction des archives...</p>
                               </div>
                           ) : (
                               <CustomerActivity activity={filteredActivity} onSaleClick={handleSaleClick} onReturnClick={handleReturnClick} />
                           )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Profile, Tools & Strategic Products */}
                <div className="space-y-10">
                    <CustomerMetrics customer={customer} />
                    
                    {customer.outstandingBalance > 0 && (
                        <div className="animate-in zoom-in-95 duration-700">
                            <Button variant="secondary" className="w-full h-20 rounded-[2rem] bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-green-600/30 group gap-4 transition-all" onClick={handleWhatsAppReminder}>
                                <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform duration-500" /> 
                                Relance WhatsApp
                            </Button>
                            <div className="mt-4 flex items-center justify-center gap-3 opacity-40">
                                <div className="h-px w-8 bg-muted-foreground" />
                                <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-widest italic">Message de solde automatisé</p>
                                <div className="h-px w-8 bg-muted-foreground" />
                            </div>
                        </div>
                    )}

                    <Card className="luxury-glass border-white/5 rounded-[3rem] overflow-hidden group shadow-2xl bg-muted/5">
                        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.03]">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <ShoppingBag className="h-4 w-4 text-primary" />
                                </div>
                                Articles Stratégiques (Top 5)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats?.topProducts?.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {stats.topProducts.map((p: any) => (
                                        <div key={p.productUuid} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all group/item">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 relative rounded-2xl overflow-hidden bg-muted border border-white/10 shadow-inner group-hover/item:scale-105 transition-all duration-500">
                                                    <Image src={getPlaceholder().url} alt="" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black uppercase tracking-tight truncate max-w-[140px] group-hover/item:text-primary transition-colors">{p.name}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black opacity-40 tracking-widest">Consommation régulière</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black h-7 px-4 rounded-xl text-[11px] shadow-sm">
                                                {p.quantity} Un.
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-20 grayscale space-y-6">
                                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                                        <ShoppingBag className="h-10 w-10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Aucun flux détecté</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="p-8 rounded-[3rem] bg-muted/10 border border-white/5 flex flex-col items-center text-center space-y-5 shadow-inner group">
                        <div className="p-4 bg-background/40 rounded-2xl border border-white/10 group-hover:rotate-6 transition-transform duration-500">
                            <Calendar className="h-8 w-8 text-primary opacity-40" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-60 mb-1">Autorité créée le</p>
                            <p className="text-xl font-black uppercase italic tracking-tighter">
                                {new Date(customer.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
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
