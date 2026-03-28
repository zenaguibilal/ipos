
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { Printer, RefreshCw, Save, Loader2, ShieldAlert, Coins, History, Scale, Landmark, Banknote, Target, TrendingUp, Info, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ZakatReport } from '@/components/zakat/ZakatReport';
import { ZakatHistoryDialog } from '@/components/zakat/ZakatHistoryDialog';

/**
 * @fileOverview Zakat Command Center (Finalized Sovereign Edition)
 * المركز السيادي لتقييم الأصول النقدية وتقدير فريضة الزكاة بدقة حتمية.
 */

export default function ZakatPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, zakatHistory, isLoading, zakatData, zakatInputs, result, isSaving } = useAppStore(state => ({
        profile: state.profile,
        zakatHistory: state.zakatHistory,
        isLoading: state.isLoading.zakat,
        isSaving: state.isLoading.zakatSaving,
        zakatData: state.zakat.autoData,
        zakatInputs: state.zakat.inputs,
        result: state.zakat.result
    }));
    const { refreshZakatData, setZakatInputs, saveZakatCalculation } = useAppActions();
    
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    
    const reportRef = useRef<HTMLDivElement>(null);

    // Absolute Access Guard
    useEffect(() => {
        if (profile && !isManagerOrAdmin) {
            toast.error("Accès Souverain Requis", { 
                description: "Le calculateur de Zakat est réservé aux autorités de gestion.",
                icon: <ShieldAlert className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isManagerOrAdmin, router]);

    useEffect(() => { 
        if (isManagerOrAdmin) refreshZakatData(); 
    }, [refreshZakatData, isManagerOrAdmin]);

    const handleSave = async () => {
        if (!result) return;
        try {
            await saveZakatCalculation(result);
            toast.success("Point de calcul gravé dans l'archive Cloud.");
        } catch (error) { 
            toast.error("Échec de l'archivage souverain."); 
        }
    };

    const handleViewHistory = (h: any) => {
        setSelectedHistory(h);
        setIsHistoryDialogOpen(true);
    };

    const handlePrintReport = () => {
        if (!result) return;
        const printableContent = document.getElementById('receipt-for-print');
        const reportElement = reportRef.current;
        if (!printableContent || !reportElement) return;

        const clone = reportElement.cloneNode(true) as HTMLDivElement;
        clone.classList.add('a4-receipt');
        printableContent.innerHTML = '';
        printableContent.appendChild(clone);

        setTimeout(() => window.print(), 150);
    };

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
            </div>
        );
    }

    const isInitialLoading = isLoading && zakatHistory.length === 0;

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader title="Calculateur de Zakat" description="Évaluation déterministه des actifs commerciaux و estimation de la فريضة légale.">
                    <div className="flex gap-2 w-full sm:w-auto luxury-glass p-1.5 bg-muted/20 border-white/5 shadow-inner">
                        <Button variant="outline" onClick={() => refreshZakatData()} disabled={isLoading} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 border-white/10 hover:bg-primary/10">
                            <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} /> 
                            Actualiser
                        </Button>
                        <Button onClick={handlePrintReport} disabled={!result} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Printer className="h-4 w-4" /> 
                            Rapport Officiel
                        </Button>
                    </div>
                </PageHeader>
            </div>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-10 luxury-glass p-1.5 h-14 bg-muted/20 border-white/5 shadow-inner">
                    <TabsTrigger value="calculator" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <Scale className="h-4 w-4" />
                        Évaluation Live
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">
                        <History className="h-4 w-4" />
                        Archives Cloud
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="calculator" className="space-y-10 outline-none animate-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Actifs Panel */}
                        <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden group shadow-2xl hover:border-primary/20 transition-all">
                            <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-primary">
                                    <TrendingUp className="h-4 w-4" />
                                    Actifs (Composantes)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner group-hover:border-primary/20 transition-all">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Valorisation des Stocks</Label>
                                        <p className="text-2xl font-black tracking-tighter">
                                            {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.inventoryValue)}
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner group-hover:border-primary/20 transition-all">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Créances Clients (Dettes Actives)</Label>
                                        <p className="text-2xl font-black tracking-tighter text-emerald-500">
                                            {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.customerDebts)}
                                        </p>
                                    </div>
                                </div>
                                
                                <Separator className="bg-white/5" />

                                <div className="space-y-4">
                                    <Label htmlFor="cash" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Liquidités en Caisse (DA)</Label>
                                    <div className="relative group">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                        <Input 
                                            id="cash"
                                            type="number" 
                                            value={zakatInputs.cashOnHand || ''} 
                                            onChange={(e) => setZakatInputs({ cashOnHand: Number(e.target.value) })} 
                                            className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-primary/40 shadow-inner" 
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Passifs Panel */}
                        <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden group shadow-2xl hover:border-destructive/20 transition-all">
                            <CardHeader className="bg-destructive/5 border-b border-white/5 p-8">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-destructive">
                                    <Landmark className="h-4 w-4" />
                                    Passifs (Déductions)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner group-hover:border-destructive/20 transition-all">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Encours Fournisseurs</Label>
                                    <p className="text-2xl font-black tracking-tighter text-destructive">
                                        {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.supplierDebts)}
                                    </p>
                                </div>
                                
                                <Separator className="bg-white/5" />

                                <div className="space-y-4">
                                    <Label htmlFor="other-debts" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Autres Charges & Dettes (DA)</Label>
                                    <div className="relative group">
                                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/30 group-focus-within:text-destructive transition-colors" />
                                        <Input 
                                            id="other-debts"
                                            type="number" 
                                            value={zakatInputs.otherDebts || ''} 
                                            onChange={(e) => setZakatInputs({ otherDebts: Number(e.target.value) })} 
                                            className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-destructive/40 shadow-inner" 
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic px-1 leading-relaxed">
                                        * Indiquez les charges opérationnelles échues non réglées.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Result Panel */}
                        {result && (
                            <Card className={cn(
                                "luxury-glass border-2 overflow-hidden transition-all duration-1000 shadow-2xl relative",
                                result.isNisabReached ? "border-emerald-500/40 bg-emerald-500/[0.03]" : "border-white/5 bg-muted/10 grayscale-[0.5]"
                            )}>
                                {result.isNisabReached && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />}
                                <CardHeader className="text-center bg-white/5 p-10 border-b border-white/5 relative z-10">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-6">Verdict Core iPOS</CardTitle>
                                    <p className={cn("text-5xl font-black tracking-tighter mb-2", result.isNisabReached ? "text-emerald-500" : "text-muted-foreground")}>
                                        {formatCurrency(result.zakatBase)}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Assiette Zakat Nette</p>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10 relative z-10">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center p-4 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Nisab Or (85g)</p>
                                            <p className="text-sm font-black text-foreground">{formatCurrency(result.nisab)}</p>
                                        </div>
                                        <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Zakat Due (2.5%)</p>
                                            <p className="text-xl font-black text-emerald-500">{formatCurrency(result.zakatAmount)}</p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "p-6 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-700 shadow-xl",
                                        result.isNisabReached ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-muted/30 border-white/10 text-muted-foreground"
                                    )}>
                                        {result.isNisabReached ? <CheckCircle2 className="h-8 w-8 shrink-0" /> : <AlertCircle className="h-8 w-8 shrink-0" />}
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black uppercase tracking-widest">{result.isNisabReached ? 'Nisab Atteint' : 'Nisab non Atteint'}</p>
                                            <p className="text-[10px] italic leading-tight font-medium">
                                                {result.isNisabReached 
                                                    ? "La فريضة est applicable sur votre patrimoine commercial actuel."
                                                    : "Vos actifs nets sont inférieurs au seuil légal de taxation."}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-10 bg-white/5 border-t border-white/5 relative z-10">
                                    <Button 
                                        onClick={handleSave} 
                                        disabled={isSaving || !result.isNisabReached} 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] gap-4 shadow-2xl shadow-emerald-500/30 group hover:scale-105 active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>} 
                                        Graver le Point de Calcul
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>

                    <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <Info className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-black uppercase tracking-tight italic">Audit de Conformité Deterministe</p>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                                    Le calcul est effectué en soustrayant vos dettes fournisseurs de vos actifs (stocks + cash + créances clients). Le prix de l'or servant de référence هو {formatCurrency(zakatData.goldPrice)}/g.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-10 px-6 rounded-xl border-emerald-500/20 text-emerald-500 font-black uppercase text-[9px] tracking-widest bg-background/40">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                iPOS Islamic Audit Active
                            </Badge>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in slide-in-from-bottom-4 duration-700 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                        {zakatHistory.map(h => (
                            <Card key={h.uuid} className="luxury-glass p-8 border-white/5 bg-muted/10 hover:border-emerald-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-64 cursor-pointer shadow-xl" onClick={() => handleViewHistory(h)}>
                                <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <Scale className="h-24 w-24 rotate-12" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                                        <History className="h-3 w-3 text-emerald-500" />
                                        {new Date(h.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">{formatCurrency(h.zakatAmount)}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest">Sur une base de {formatCurrency(h.zakatBase)}</p>
                                </div>
                                <div className="relative z-10 pt-6 border-t border-white/5 mt-4">
                                    <Button variant="ghost" className="w-full rounded-xl h-10 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-emerald-500/10 hover:text-emerald-500">
                                        Audit des Détails
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {zakatHistory.length === 0 && (
                            <div className="col-span-full py-40 text-center opacity-30 grayscale border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5 space-y-6">
                                <div className="h-24 w-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center mx-auto">
                                    <History className="h-12 w-12 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-2xl font-black uppercase tracking-widest">Archives Vierges</p>
                                    <p className="text-xs font-bold uppercase tracking-widest italic leading-relaxed">Les نقاط de calcul gravés dans le Cloud iPOS apparaîtront ici.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <ZakatHistoryDialog 
                isOpen={isHistoryDialogOpen} 
                onOpenChange={setIsHistoryDialogOpen} 
                calculation={selectedHistory} 
            />

            {/* Hidden component for printing */}
            <div className="hidden">
                {result && <ZakatReport ref={reportRef} calculation={result} profile={profile} />}
            </div>
        </div>
    );
}
