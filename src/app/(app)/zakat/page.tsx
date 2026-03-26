
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
    HandHelping,
    UserX,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ZakatPage() {
    const profile = useAppStore(state => state.profile);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Manual inputs
    const [cashOnHand, setCashOnHand] = useState(0);
    const [otherDebts, setOtherDebts] = useState(0);
    const [badDebts, setBadDebts] = useState(0);
    
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
            otherDebts,
            badDebts
        });
    }, [autoData, cashOnHand, otherDebts, badDebts]);

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

    const goldPriceWarning = autoData.goldPrice <= 0;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader 
                title="Calculateur de Zakat Commerciale"
                description="Évaluez vos actifs nets et déterminez le montant de votre Zakat annuelle selon les règles chcharia."
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchZakatData(true)} disabled={isRefreshing} className="luxury-glass border-primary/20">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Actualiser les stocks
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer le rapport A4
                    </Button>
                </div>
            </PageHeader>

            {goldPriceWarning && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-pulse">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold">
                        Attention : Le prix de l'or n'est pas configuré. Le calcul του النصاب (Nisab) sera incorrect. 
                        Veuillez le mettre à jour dans votre <a href="/profile" className="underline">Profil</a>.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assets Column */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
                        <Coins className="h-4 w-4" /> Actifs (عروض التجارة)
                    </h3>
                    
                    <Card className="luxury-glass border-primary/10 hover:border-primary/30 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" /> Valeur du Stock (COGS)
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Prix d'achat actuel de tout l'inventaire</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black">{formatCurrency(autoData.inventoryValue)}</p>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass border-primary/10 bg-primary/5 shadow-inner">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Créances Clients
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Dettes clients en attente de paiement</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
                                <span className="text-muted-foreground">Total Dettes Client :</span>
                                <span className="font-bold">{formatCurrency(autoData.customerDebts)}</span>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bad-debts" className="text-[10px] font-black uppercase flex items-center gap-1.5 text-destructive">
                                    <UserX className="h-3 w-3" /> Déduire Dettes المعدومة (Inaccessibles)
                                </Label>
                                <div className="relative">
                                    <Input 
                                        id="bad-debts"
                                        type="number" 
                                        value={badDebts || ''} 
                                        onChange={(e) => setBadDebts(Number(e.target.value))}
                                        className="h-10 text-lg font-black rounded-xl border-destructive/20 bg-background/50 focus:border-destructive"
                                        placeholder="0.0"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">DA</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass bg-primary/5 border-primary/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-primary" /> Liquidités (Cash)
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Argent liquide en caisse ou en banque</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        <ArrowRight className="h-4 w-4" /> Passifs (الخصوم والديون)
                    </h3>

                    <Card className="luxury-glass border-destructive/10 hover:border-destructive/30 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Scale className="h-4 w-4 text-destructive" /> Dettes Fournisseurs
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Total des soldes dus aux fournisseurs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-destructive">{formatCurrency(autoData.supplierDebts)}</p>
                        </CardContent>
                    </Card>

                    <Card className="luxury-glass bg-destructive/5 border-destructive/20 shadow-inner">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" /> Autres Dettes Professionnelles
                            </CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold">Loyer, factures, salaires dus</CardDescription>
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
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400">Règle du النصاب (85g Or)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground italic">Prix Or (1g) :</span>
                                <span className="font-bold">{formatCurrency(autoData.goldPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground italic">Seuil du النصاب :</span>
                                <span className="font-black text-blue-400">{formatCurrency(result.nisab)}</span>
                            </div>
                            <p className="text-[9px] italic text-muted-foreground pt-2 leading-relaxed">
                                * La Zakat est obligatoire si vos actifs nets dépassent la valeur de 85g d'or fin.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Final Result Column */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary flex items-center gap-2 px-2">
                        <HandHelping className="h-4 w-4" /> Résultat Final (2.5%)
                    </h3>

                    <Card className={cn(
                        "luxury-glass border-2 overflow-hidden relative theme-transition",
                        result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5" : "border-muted bg-muted/5 opacity-80"
                    )}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            {result.isNisabReached ? <CheckCircle2 className="h-24 w-24 text-chart-quaternary" /> : <AlertTriangle className="h-24 w-24 text-muted-foreground" />}
                        </div>
                        
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">وعاء الزكاة (Base)</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase">Actifs nets imposables</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-4xl font-black tracking-tighter">{formatCurrency(result.zakatBase)}</p>
                            
                            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                {result.isNisabReached ? (
                                    <>
                                        <div className="flex items-center gap-2 text-chart-quaternary font-bold text-sm uppercase">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>النصاب بلغ</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            Votre fortune commerciale dépasse le seuil légal. La Zakat est due sur la totalité du montant à un taux de 2.5%.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm uppercase">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>النصاب لم يبلغ</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            Le montant total est inférieur au seuil du النصاب ({formatCurrency(result.nisab)}). Aucune Zakat obligatoire pour cet exercice.
                                        </p>
                                    </>
                                )}
                            </div>
                        </CardContent>
                        
                        {result.isNisabReached && (
                            <CardFooter className="bg-chart-quaternary p-6 border-t-0">
                                <div className="w-full text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Montant à reverser</p>
                                    <p className="text-4xl font-black text-white drop-shadow-sm">{formatCurrency(result.zakatAmount)}</p>
                                </div>
                            </CardFooter>
                        )}
                    </Card>

                    <div className="p-6 bg-muted/20 rounded-[2rem] border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            Guide de calcul
                        </h4>
                        <ul className="text-[11px] space-y-2 text-muted-foreground leading-relaxed">
                            <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                <span><b>Stock :</b> Évalué au prix d'achat à la date anniversaire.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                <span><b>Créances :</b> Ne comptez que les dettes que vous êtes sûr de récupérer.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                <span><b>Passifs :</b> Déduisez vos dettes immédiates (fournisseurs, charges).</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Printable Report Hidden Layout */}
            <div id="zakat-report" className="hidden p-8 bg-white text-black font-sans min-h-[297mm] relative">
                <header className="text-center mb-10 border-b-2 border-black pb-6">
                    <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.companyName || 'Mon Établissement'}</h1>
                    <p className="text-sm font-bold uppercase mt-1">Rapport de Situation pour la Zakat Commerciale</p>
                    <div className="mt-4 flex justify-between text-xs px-10 italic">
                        <span>Date du calcul : {format(new Date(), 'd MMMM yyyy', { locale: fr })}</span>
                        <span>Heure : {format(new Date(), 'HH:mm')}</span>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-12 mb-10">
                    <div className="space-y-4">
                        <h2 className="font-black border-b-2 border-gray-800 text-sm uppercase pb-1 flex items-center gap-2">
                            📦 Actifs Circulants (Assets)
                        </h2>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span>Valeur marchande du stock</span> <span>{formatCurrency(result.inventoryValue)}</span></div>
                            <div className="flex justify-between"><span>Liquidités & Banques</span> <span>{formatCurrency(result.cashOnHand)}</span></div>
                            <div className="flex justify-between"><span>Créances Clients Récupérables</span> <span>{formatCurrency(result.customerDebts - result.badDebts)}</span></div>
                            <div className="flex justify-between font-black text-sm pt-3 border-t border-dashed">
                                <span>TOTAL ACTIFS</span> 
                                <span>{formatCurrency(result.inventoryValue + result.cashOnHand + (result.customerDebts - result.badDebts))}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="font-black border-b-2 border-gray-800 text-sm uppercase pb-1 flex items-center gap-2">
                            ⚖️ Passifs Exigibles (Liabilities)
                        </h2>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span>Dettes Fournisseurs</span> <span>{formatCurrency(result.supplierDebts)}</span></div>
                            <div className="flex justify-between"><span>Autres Charges & Dettes</span> <span>{formatCurrency(result.otherDebts)}</span></div>
                            <div className="flex justify-between font-black text-sm pt-3 border-t border-dashed">
                                <span>TOTAL PASSIFS</span> 
                                <span>{formatCurrency(result.supplierDebts + result.otherDebts)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 bg-gray-50 border-2 border-black p-8 rounded-3xl text-center space-y-6">
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-bold uppercase text-xs tracking-widest text-gray-600">Base Imposable (وعاء الزكاة) :</span>
                            <span className="text-2xl font-black">{formatCurrency(result.zakatBase)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs italic text-gray-500">
                            <span>Seuil du النصاب (85g d'or) :</span>
                            <span>{formatCurrency(result.nisab)}</span>
                        </div>
                        
                        <div className="h-px bg-gray-300 w-full" />
                        
                        <div className="pt-2">
                            {result.isNisabReached ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-green-700 uppercase tracking-widest">Zakat Obligatoire (نصاب مستوفى)</p>
                                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white rounded-2xl">
                                        <span className="font-bold uppercase text-xs">Montant de la Zakat (2.5%) :</span>
                                        <span className="text-3xl font-black">{formatCurrency(result.zakatAmount)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-200 rounded-2xl">
                                    <p className="font-bold text-sm uppercase">Zakat Non Exigible</p>
                                    <p className="text-[10px] mt-1 italic">Le patrimoine n'a pas atteint le seuil du النصاب.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-20 grid grid-cols-2 gap-20 text-center text-[10px] font-black uppercase tracking-tighter opacity-40">
                    <div className="border-t border-black pt-2">Visa Comptable</div>
                    <div className="border-t border-black pt-2">Cachet Établissement</div>
                </div>

                <footer className="absolute bottom-10 left-10 right-10 pt-4 border-t border-gray-200 flex justify-between items-center text-[9px] text-gray-400 italic">
                    <p>Document généré par le système iPOS pour faciliter le calcul comptable annuel.</p>
                    <p>Veuillez consulter une autorité religieuse compétente pour toute situation complexe.</p>
                </footer>
            </div>
        </div>
    );
}
