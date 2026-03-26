
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, Printer, Loader2, Filter, History, Package, Building2, Phone, Mail, MapPin, Tag, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Supplier, StockIntake } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { supplierService } from '@/services/supplier.service';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SupplierActivity } from '@/components/suppliers/SupplierActivity';
import { SupplierPaymentDialog } from '@/components/suppliers/SupplierPaymentDialog';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';

export default function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supplierUuid = params.uuid as string;

    const [supplier, setSupplier] = useState<Supplier | undefined | null>(undefined);
    const [activity, setActivity] = useState<any[]>([]);
    const [linkedProductsCount, setLinkedProductsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isIntakeDetailsOpen, setIsIntakeDetailsOpen] = useState(false);

    const fetchSupplierData = useCallback(async () => {
        if (!supplierUuid) return;
        setIsLoading(true);
        try {
            const [sup, act, prods] = await Promise.all([
                supplierService.getSupplierByUuid(supplierUuid),
                supplierService.getSupplierActivity(supplierUuid),
                productService.filterProducts({ supplierUuid })
            ]);
            
            setSupplier(sup);
            setActivity(act);
            setLinkedProductsCount(prods.length);
            
            if (!sup) {
                toast.error("Le fournisseur est introuvable.");
            }
        } catch (error: any) {
            toast.error("Échec du chargement des données.");
            setSupplier(null);
        } finally {
            setIsLoading(false);
        }
    }, [supplierUuid]);
    
    useEffect(() => {
        fetchSupplierData();
    },[fetchSupplierData]);

    const stats = useMemo(() => {
        if (!activity.length) return { totalBought: 0, intakeCount: 0 };
        const intakes = activity.filter(a => a.type === 'intake');
        const totalBought = intakes.reduce((sum, i) => sum + i.totalValue, 0);
        return { totalBought, intakeCount: intakes.length };
    }, [activity]);

    const handleIntakeClick = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsIntakeDetailsOpen(true);
    };

    if (isLoading && !supplier) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-12 w-1/3 rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-80 w-full rounded-3xl" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-60 w-full rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!supplier) {
        return (
            <div className="p-4 sm:p-6 text-center py-20">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h1 className="text-xl font-bold">Fournisseur introuvable</h1>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/suppliers">Retour à la liste</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild className="rounded-xl luxury-glass border-primary/20">
                    <Link href="/suppliers"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <PageHeader 
                    title={supplier.name}
                    description={`Partenaire commercial • ID: ${supplier.uuid.substring(0,8)}`}
                 >
                    <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]">
                        <Building2 className="mr-2 h-3 w-3" />
                        FOURNISSEUR
                    </Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="luxury-glass bg-primary/5 border-primary/10">
                            <CardHeader className="py-3">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Volume d'Achat Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black">{formatCurrency(stats.totalBought)}</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">{stats.intakeCount} Factures enregistrées</p>
                            </CardContent>
                        </Card>
                        <Card className="luxury-glass bg-blue-500/5 border-blue-500/10">
                            <CardHeader className="py-3">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-400" />
                                    Articles référencés
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black text-blue-400">{linkedProductsCount}</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Produits liés à ce fournisseur</p>
                            </CardContent>
                        </Card>
                    </div>

                     <Card className="luxury-glass border-white/5">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-6">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
                                    <History className="h-5 w-5 text-primary" />
                                    Historique des Opérations
                                </CardTitle>
                                <CardDescription className="text-xs">Suivi des réceptions de stock et des règlements financiers.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                           <SupplierActivity 
                                activity={activity} 
                                onIntakeClick={handleIntakeClick}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className={cn(
                        "luxury-glass border-2",
                        supplier.balance > 0 ? "border-destructive/30 bg-destructive/5" : "border-chart-quaternary/30 bg-chart-quaternary/5"
                    )}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                État du Compte
                                <Banknote className={cn("h-4 w-4", supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary")} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className={cn(
                                    "text-4xl font-black",
                                    supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary"
                                )}>
                                    {formatCurrency(supplier.balance)}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium mt-1 uppercase">
                                    {supplier.balance > 0 ? "Montant restant à régler" : "Compte entièrement soldé"}
                                </p>
                            </div>
                            
                            <Button 
                                className={cn(
                                    "w-full h-12 rounded-xl font-bold gap-2 shadow-lg",
                                    supplier.balance > 0 ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-chart-quaternary hover:bg-chart-quaternary/90 shadow-chart-quaternary/20"
                                )}
                                onClick={() => setIsPaymentDialogOpen(true)}
                            >
                                <Banknote className="h-5 w-5" />
                                {supplier.balance > 0 ? "Régler le solde" : "Effectuer un acompte"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                Coordonnées
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between group">
                                    <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70">
                                        <User className="h-3 w-3"/> Contact
                                    </span>
                                    <span className="font-bold">{supplier.contactPerson || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70">
                                        <Phone className="h-3 w-3"/> Téléphone
                                    </span>
                                    <div className="flex gap-2">
                                        <span className="font-mono font-bold">{supplier.phone || 'N/A'}</span>
                                        {supplier.phone && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-lg" asChild>
                                                <a href={`tel:${supplier.phone}`}><Phone className="h-3 w-3" /></a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70">
                                        <Mail className="h-3 w-3"/> E-mail
                                    </span>
                                    <span className="font-medium text-right max-w-[150px] truncate">{supplier.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4 group pt-2 border-t border-white/5">
                                    <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70 mt-1">
                                        <MapPin className="h-3 w-3"/> Adresse
                                    </span>
                                    <span className="font-medium text-right italic leading-tight text-muted-foreground">{supplier.address || 'N/A'}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/5 p-3 text-[10px] text-muted-foreground justify-center gap-1">
                            Partenaire depuis le {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </CardFooter>
                    </Card>
                </div>
            </div>
            
             {supplier && (
                <SupplierPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    supplier={supplier}
                    onSuccess={fetchSupplierData}
                />
            )}

            <StockIntakeDetailsDialog
                isOpen={isIntakeDetailsOpen}
                onOpenChange={setIsIntakeDetailsOpen}
                intake={selectedIntake}
                supplierName={supplier.name}
            />
        </div>
    );
}
