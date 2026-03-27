'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, History, Package, Building2, Phone, MapPin, ArrowRight, TrendingUp, BarChart3, Search, MessageSquare, ExternalLink, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import type { StockIntake } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatCurrency, cn, getPlaceholder } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SupplierActivity } from '@/components/suppliers/SupplierActivity';
import { SupplierPaymentDialog } from '@/components/suppliers/SupplierPaymentDialog';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { PrintSupplierStatementDialog } from '@/components/suppliers/PrintSupplierStatementDialog';
import { useAppStore, useAppActions } from '@/stores/appStore';

/**
 * @fileOverview Supplier Detail Page (Refined)
 */

export default function SupplierDetailPage() {
    const params = useParams();
    const supplierUuid = params.uuid as string;

    const { selectedSupplier, isLoading } = useAppStore(state => ({
        selectedSupplier: state.selectedSupplier,
        isLoading: state.isLoading.supplierDetail
    }));
    const { fetchSupplierDetails } = useAppActions();

    const [productSearch, setProductSearch] = useState('');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isIntakeDetailsOpen, setIsIntakeDetailsOpen] = useState(false);

    useEffect(() => {
        if (supplierUuid) fetchSupplierDetails(supplierUuid);
    }, [supplierUuid, fetchSupplierDetails]);

    const supplier = selectedSupplier.data;
    const activity = selectedSupplier.activity;
    const linkedProducts = selectedSupplier.products;
    const stats = selectedSupplier.stats;

    const chartData = useMemo(() => {
        const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
        return months.map(month => {
            const monthStr = format(month, 'yyyy-MM');
            const total = activity
                .filter(a => a.type === 'intake' && format(new Date(a.date), 'yyyy-MM') === monthStr)
                .reduce((sum, i) => sum + i.totalValue, 0);
            return { name: format(month, 'MMM', { locale: fr }), total };
        });
    }, [activity]);

    const filteredProducts = useMemo(() => {
        return linkedProducts.filter(p => 
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.category?.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [linkedProducts, productSearch]);

    const handleIntakeClick = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsIntakeDetailsOpen(true);
    };

    const handleWhatsApp = () => {
        if (!supplier?.phone) return;
        window.open(`https://wa.me/${supplier.phone}`, '_blank');
    };

    if (isLoading && !supplier) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-12 w-1/3 rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6"><Skeleton className="h-80 w-full rounded-3xl" /></div>
                    <div className="space-y-6"><Skeleton className="h-60 w-full rounded-3xl" /></div>
                </div>
            </div>
        );
    }
    
    if (!supplier) {
        return <div className="p-20 text-center"><Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" /><h1 className="text-xl font-bold">Fournisseur introuvable</h1><Button asChild variant="link" className="mt-4"><Link href="/suppliers">Retour</Link></Button></div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild className="rounded-xl luxury-glass border-primary/20"><Link href="/suppliers"><ArrowLeft className="h-4 w-4" /></Link></Button>
                 <PageHeader title={supplier.name} description={`Partenaire commercial • ID: ${supplier.uuid.substring(0,8)}`}>
                    <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]"><Building2 className="mr-2 h-3 w-3" />FOURNISSEUR</Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <Card className="luxury-glass border-primary/10 bg-primary/5">
                            <CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Achat Total</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-black">{formatCurrency(stats?.totalBought || 0)}</p><p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">{stats?.intakeCount || 0} Réceptions</p></CardContent>
                        </Card>
                        <Card className="luxury-glass border-blue-500/10 bg-blue-500/5">
                            <CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4 text-blue-400" />Articles</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-black text-blue-400">{linkedProducts.length}</p><p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Produits référencés</p></CardContent>
                        </Card>
                        <Card className="luxury-glass border-chart-quaternary/10 bg-chart-quaternary/5">
                            <CardHeader className="py-3"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4 text-chart-quaternary" />Panier Moyen</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-black text-chart-quaternary">{formatCurrency(stats?.avgIntake || 0)}</p><p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Valeur/Facture</p></CardContent>
                        </Card>
                    </div>

                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest"><TrendingUp className="h-4 w-4 text-primary" />Évolution des Commandes</CardTitle></CardHeader>
                        <CardContent className="h-48 pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs><linearGradient id="colorTotal" x1="0" x1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'gray'}} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a120c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(val: number) => [formatCurrency(val), 'Montant']} />
                                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 luxury-glass p-1 mb-4 h-12 bg-muted/20">
                            <TabsTrigger value="activity" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background"><History className="h-4 w-4" /> Historique</TabsTrigger>
                            <TabsTrigger value="products" className="rounded-xl gap-2 font-bold data-[state=active]:bg-background"><Package className="h-4 w-4" /> Produits ({linkedProducts.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="activity"><Card className="luxury-glass border-white/5"><CardContent className="p-6"><SupplierActivity activity={activity} onIntakeClick={handleIntakeClick} /></CardContent></Card></TabsContent>
                        <TabsContent value="products">
                            <Card className="luxury-glass border-white/5">
                                <CardHeader className="px-6 py-4 border-b border-white/5"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filtrer les produits..." className="pl-10 h-10 bg-background/50 rounded-xl" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} /></div></CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {filteredProducts.map(product => (
                                            <div key={product.uuid} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-white/10 bg-muted"><Image src={product.imageUrl || getPlaceholder(product.category).url} alt={product.name} fill className="object-cover" /></div>
                                                    <div><p className="font-bold text-sm">{product.name}</p><p className="text-[10px] text-muted-foreground uppercase">{product.category}</p></div>
                                                </div>
                                                <div className="text-right flex items-center gap-6">
                                                    <div><p className="text-[10px] text-muted-foreground font-black uppercase">Stock</p><Badge variant={product.quantity <= product.minStockLevel ? 'destructive' : 'outline'} className="text-[10px] h-5">{product.quantity} {product.unite}</Badge></div>
                                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg"><Link href={`/products?query=${product.name}`}><ExternalLink className="h-4 w-4" /></Link></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className={cn("luxury-glass border-2 overflow-hidden", supplier.balance > 0 ? "border-destructive/30 bg-destructive/5" : "border-chart-quaternary/30 bg-chart-quaternary/5")}>
                        <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">État du Compte <Banknote className={cn("h-4 w-4", supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary")} /></CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><p className={cn("text-4xl font-black", supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary")}>{formatCurrency(supplier.balance)}</p><p className="text-xs text-muted-foreground font-medium mt-1 uppercase">{supplier.balance > 0 ? "Montant restant à régler" : "Compte soldé"}</p></div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" className="h-12 rounded-xl font-bold gap-2 luxury-glass border-white/10" onClick={() => setIsStatementDialogOpen(true)}><Printer className="h-4 w-4" /> Relevé</Button>
                                <Button className={cn("h-12 rounded-xl font-bold gap-2 shadow-lg", supplier.balance > 0 ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-chart-quaternary hover:bg-chart-quaternary/90 shadow-chart-quaternary/20")} onClick={() => setIsPaymentDialogOpen(true)}><Banknote className="h-5 w-5" /> Payer</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5 py-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />Coordonnées</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><span className="text-muted-foreground text-[10px] font-black uppercase opacity-70">Contact</span><span className="font-bold">{supplier.contactPerson || 'N/A'}</span></div>
                                <div className="flex items-center justify-between"><span className="text-muted-foreground text-[10px] font-black uppercase opacity-70">Téléphone</span><div className="flex gap-2"><span className="font-mono font-bold">{supplier.phone || 'N/A'}</span>{supplier.phone && <div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-500/10 rounded-lg" onClick={handleWhatsApp}><MessageSquare className="h-3.5 w-3.5" /></Button></div>}</div></div>
                                <div className="flex items-start justify-between gap-4 pt-2 border-t border-white/5"><span className="text-muted-foreground text-[10px] font-black uppercase opacity-70 mt-1">Adresse</span><div className="text-right"><span className="font-medium italic text-muted-foreground block text-xs">{supplier.address || 'N/A'}</span>{supplier.address && <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary" asChild><a href={`https://maps.google.com/?q=${encodeURIComponent(supplier.address)}`} target="_blank"><MapPin className="h-2 w-2 mr-1" /> Maps</a></Button>}</div></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {supplier && <SupplierPaymentDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} supplier={supplier} onSuccess={() => fetchSupplierDetails(supplierUuid)} />}
            {supplier && <PrintSupplierStatementDialog isOpen={isStatementDialogOpen} onOpenChange={setIsStatementDialogOpen} supplier={supplier} activity={activity} />}
            <StockIntakeDetailsDialog isOpen={isIntakeDetailsOpen} onOpenChange={setIsIntakeDetailsOpen} intake={selectedIntake} supplierName={supplier.name} />
        </div>
    );
}
