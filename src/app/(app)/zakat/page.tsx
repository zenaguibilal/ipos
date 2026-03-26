
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { zakatService } from '@/services/zakat.service';
import { formatCurrency, cn } from '@/lib/utils';
import { 
    Coins, 
    Package, 
    Users, 
    Banknote, 
    Wallet, 
    ArrowRight, 
    Printer, 
    RefreshCw, 
    Info, 
    AlertTriangle, 
    CheckCircle2, 
    Scale,
    HandHelping
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ZakatPage() {
    const profile = useAppStore(state => state.profile);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Manual inputs
    const [cashOnHand, setCashOnHand] = useState(0);
    const [otherDebts, setOtherDebts] = useState(0);
    
    // Automatic data
    const [autoData, setAutoData] = useState({
        inventoryValue: 0,
        customerDebts: 0,
        supplierDebts: 0,
        goldPrice: 0
    });

    const fetchZakatData = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setIsLoading(true);
        
        try {
            const data = await zakatService.getAutomaticData();
            setAutoData(data);
        } catch (error) {
            toast.error("Impossible de charger les données financières.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchZakatData();
    }, [fetchZakatData]);

    const result = useMemo(() => {
        return zakatService.calculate({
            ...autoData,
            cashOnHand,
            otherDebts
        });
    }, [autoData, cashOnHand, otherDebts]);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const reportElement = document.getElementById('zakat-report');

        if (!printableContent || !reportElement) return;

        const reportClone = reportElement.cloneNode(true) as HTMLDivElement;
        reportClone.classList.add('a4-receipt');
        reportClone.classList.remove('hidden');

        printableContent.innerHTML = '';
        printableContent.appendChild(reportClone);

        setTimeout(() => window.print(), 100);
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-12 w-1/3 rounded-2xl" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader 
                title="Calculateur de Zakat"
                description="Évaluez vos actifs commerciaux et déterminez le montant de votre Zakat annuelle."
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchZakatData(true)} disabled={isRefreshing} className="luxury-glass border-primary/20">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Actualiser
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer le rapport
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assets Column */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
                        <Coins className="h-4 w-4" /> Actifs (Ce que vous possédez)
                    </h3>
                    
                    <Card className="luxury-glass border-primary/10 hover:border-primary/30 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" /> Valeur du Stock
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Calculé sur le prix d'achat</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black">{formatCurrency(autoData.inventoryValue)}</p>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass border-primary/10 hover:border-primary/30 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Créances (Dettes clients)
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Dettes "espérées" récupérables</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black">{formatCurrency(autoData.customerDebts)}</p>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass bg-primary/5 border-primary/20 shadow-inner">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-primary" /> Liquidités (Cash)
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Argent en caisse ou en banque</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={cashOnHand || ''} 
                                    onChange={(e) => setCashOnHand(Number(e.target.value))}
                                    className="h-14 text-2xl font-black rounded-xl border-primary/20 bg-background/50 focus:border-primary"
                                    placeholder="0.0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-muted-foreground">DA</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Liabilities Column */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2 px-2">
                        <ArrowRight className="h-4 w-4" /> Passifs (Ce que vous devez)
                    </h3>

                    <Card className="luxury-glass border-destructive/10 hover:border-destructive/30 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Scale className="h-4 w-4 text-destructive" /> Dettes Fournisseurs
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Sommes dues pour marchandises</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-destructive">{formatCurrency(autoData.supplierDebts)}</p>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass bg-destructive/5 border-destructive/20 shadow-inner">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" /> Autres Dettes
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Prêts, charges, loyers à payer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={otherDebts || ''} 
                                    onChange={(e) => setOtherDebts(Number(e.target.value))}
                                    className="h-14 text-2xl font-black rounded-xl border-destructive/20 bg-background/50 focus:border-destructive"
                                    placeholder="0.0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-muted-foreground">DA</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass border-blue-500/10 bg-blue-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400">Information النصاب</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Prix de l'or (1g) :</span>
                                <span className="font-bold">{formatCurrency(autoData.goldPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Nisab (85g) :</span>
                                <span className="font-black text-blue-400">{formatCurrency(result.nisab)}</span>
                            </div>
                            <p className="text-[10px] italic text-muted-foreground pt-2">
                                * Le Nisab est le seuil minimum de richesse pour être assujetti à la Zakat.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Final Result Column */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary flex items-center gap-2 px-2">
                        <HandHelping className="h-4 w-4" /> Résultat (2.5%)
                    </h3>

                    <Card className={cn(
                        "luxury-glass border-2 overflow-hidden relative",
                        result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5" : "border-muted bg-muted/5"
                    )}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            {result.isNisabReached ? <CheckCircle2 className="h-24 w-24 text-chart-quaternary" /> : <AlertTriangle className="h-24 w-24 text-muted-foreground" />}
                        </div>
                        
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Base Imposable</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase">Actifs nets après passifs</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-4xl font-black tracking-tighter">{formatCurrency(result.zakatBase)}</p>
                            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                                {result.isNisabReached ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-chart-quaternary font-bold text-sm">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Nisab atteint</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Votre richesse dépasse le seuil légal. La Zakat est due sur l'intégralité de la base imposable.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Nisab non atteint</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Le montant total est inférieur au Nisab ({formatCurrency(result.nisab)}). Aucune Zakat obligatoire pour le moment.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        {result.isNisabReached && (
                            <CardFooter className="bg-chart-quaternary p-6">
                                <div className="w-full text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Montant de la Zakat</p>
                                    <p className="text-4xl font-black text-white">{formatCurrency(result.zakatAmount)}</p>
                                </div>
                            </CardFooter>
                        )}
                    </Card>

                    <div className="p-6 bg-muted/20 rounded-[2rem] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Rappel Religieux
                        </h4>
                        <p className="text-xs italic leading-relaxed text-muted-foreground">
                            "La Zakat commerciale se calcule sur la valeur marchande actuelle des produits (prix d'achat ou de revient) à la date du calcul, et non sur le prix de vente futur."
                        </p>
                    </div>
                </div>
            </div>

            {/* Printable Report Hidden */}
            <div id="zakat-report" className="hidden p-8 bg-white text-black font-sans">
                <header className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold uppercase">{profile?.companyName || 'Mon Commerce'}</h1>
                    <p className="text-sm">Rapport Annuel de Zakat Commerciale</p>
                    <p className="text-xs">Date du calcul : {format(new Date(), 'Pp', { locale: fr })}</p>
                </header>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <h2 className="font-bold border-b text-sm uppercase">Détail des Actifs</h2>
                        <div className="flex justify-between text-xs"><span>Valeur du stock (COGS)</span> <span>{formatCurrency(result.inventoryValue)}</span></div>
                        <div className="flex justify-between text-xs"><span>Liquidités & Cash</span> <span>{formatCurrency(result.cashOnHand)}</span></div>
                        <div className="flex justify-between text-xs"><span>Créances Clients</span> <span>{formatCurrency(result.customerDebts)}</span></div>
                        <div className="flex justify-between font-bold text-xs pt-2 border-t"><span>TOTAL ACTIFS</span> <span>{formatCurrency(result.inventoryValue + result.cashOnHand + result.customerDebts)}</span></div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-bold border-b text-sm uppercase">Détail des Passifs</h2>
                        <div className="flex justify-between text-xs"><span>Dettes Fournisseurs</span> <span>{formatCurrency(result.supplierDebts)}</span></div>
                        <div className="flex justify-between text-xs"><span>Autres Dettes & Charges</span> <span>{formatCurrency(result.otherDebts)}</span></div>
                        <div className="flex justify-between font-bold text-xs pt-2 border-t"><span>TOTAL PASSIFS</span> <span>{formatCurrency(result.supplierDebts + result.otherDebts)}</span></div>
                    </div>
                </div>

                <div className="bg-gray-100 p-6 rounded-lg text-center space-y-4">
                    <div className="flex justify-between items-center max-w-md mx-auto">
                        <span className="font-bold uppercase text-sm">Base Imposable :</span>
                        <span className="text-xl font-black">{formatCurrency(result.zakatBase)}</span>
                    </div>
                    <div className="flex justify-between items-center max-w-md mx-auto border-t border-gray-300 pt-4">
                        <span className="font-bold uppercase text-sm text-primary">Montant Zakat (2.5%) :</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(result.zakatAmount)}</span>
                    </div>
                </div>

                <footer className="mt-12 pt-8 border-t text-[10px] text-gray-500 text-center">
                    <p>Ce document est généré par le système iPOS pour faciliter le calcul comptable de la Zakat.</p>
                    <p>Veuillez consulter une autorité religieuse pour toute situation particulière.</p>
                </footer>
            </div>
        </div>
    );
}
