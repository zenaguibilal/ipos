'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { 
    Printer, RefreshCw, Save, Loader2, ShieldAlert, Coins, History, 
    Scale, Landmark, Banknote, Target, TrendingUp, Info, 
    CheckCircle2, AlertCircle, ArrowRight, Activity,
    BarChart3, PieChart as PieChartIcon, Clock, FileUp, LayoutGrid, List, X, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ZakatReport } from '@/components/zakat/ZakatReport';
import { ZakatHistoryDialog } from '@/components/zakat/ZakatHistoryDialog';
import { ZakatHistoryTable } from '@/components/zakat/ZakatHistoryTable';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CsvImporter } from '@/lib/csv-utils';

/**
 * @fileOverview Zakat Command Center (Completed Sovereign Edition)
 * المركز السيادي لتقييم الأصول النقدية وتقدير فريضة الزكاة بدقة حتمية مع تتبع حول الحول والتحليل البصري.
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
    const [historyViewMode, setHistoryViewMode] = useState<'grid' | 'list'>('grid');
    
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

    const handleExport = () => {
        if (zakatHistory.length === 0) return;
        CsvImporter.exportZakatHistory(zakatHistory);
        toast.success("Grand Livre de Zakat exporté.");
    };

    const anniversaryInfo = useMemo(() => {
        if (!profile?.zakatAnniversary) return null;
        const anniversary = new Date(profile.zakatAnniversary);
        const daysLeft = differenceInDays(anniversary, new Date());
        return { 
            date: anniversary, 
            daysLeft,
            label: formatDistanceToNow(anniversary, { addSuffix: true, locale: fr })
        };
    }, [profile?.zakatAnniversary]);

    const chartData = useMemo(() => {
        if (!result) return [];
        return [
            { name: 'Stocks', value: result.inventoryValue, color: 'hsl(var(--primary))' },
            { name: 'Créances', value: result.customerDebts, color: '#10b981' },
            { name: 'Liquidités', value: result.cashOnHand, color: '#3b82f6' },
        ].filter(item => item.value > 0);
    }, [result]);

    const nisabGap = useMemo(() => {
        if (!result || result.isNisabReached) return 0;
        return result.nisab - result.zakatBase;
    }, [result]);

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
            </div>
        );
    }

    const isInitialLoading = isLoading && zakatHistory.length === 0;

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader title="Calculateur de Zakat" description="Évaluation حتمية des actifs commerciaux و estimation de la فريضة légale.">
                    <div className="flex gap-2 w-full sm:w-auto luxury-glass p-1.5 bg-muted/20 border-white/5 shadow-inner">
                        <Button variant="outline" onClick={() => refreshZakatData()} disabled={isLoading} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest gap-2 border-white/10 hover:bg-primary/10">
                            <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} /> 
                            Sync
                        </Button>
                        <Button onClick={handlePrintReport} disabled={!result} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                            <Printer className="h-4 w-4" /> 
                            Rapport Officiel
                        </Button>
                    </div>
                </PageHeader>
            </div>

            {/* Zakat Anniversary Alert */}
            {anniversaryInfo && (
                <div className={cn(
                    "p-6 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-1000",
                    anniversaryInfo.daysLeft <= 7 ? "bg-destructive/10 border-destructive shadow-2xl shadow-destructive/20" : "luxury-glass border-primary/20 bg-primary/5"
                )}>
                    <div className="flex items-center gap-6">
                        <div className={cn("p-4 rounded-2xl shadow-inner", anniversaryInfo.daysLeft <= 7 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary")}>
                            <Clock className={cn("h-8 w-8", anniversaryInfo.daysLeft <= 7 && "animate-pulse")} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Vigilance : <span className={anniversaryInfo.daysLeft <= 7 ? "text-destructive" : "text-primary"}>حول الحول</span></h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Le terme de votre année zakátique approche</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <p className={cn("text-3xl font-black tracking-tighter", anniversaryInfo.daysLeft <= 7 ? "text-destructive" : "text-foreground")}>
                            {anniversaryInfo.label}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                            Échéance fixée au {anniversaryInfo.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            )}

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
                                        <Input id="cash" type="number" value={zakatInputs.cashOnHand || ''} onChange={(e) => setZakatInputs({ cashOnHand: Number(e.target.value) })} className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-primary/40 shadow-inner" placeholder="0.00" />
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
                                        <Input id="other-debts" type="number" value={zakatInputs.otherDebts || ''} onChange={(e) => setZakatInputs({ otherDebts: Number(e.target.value) })} className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-destructive/40 shadow-inner" placeholder="0.00" />
                                    </div>
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
                                    
                                    {!result.isNisabReached && nisabGap > 0 && (
                                        <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 text-center animate-in zoom-in-95 duration-500">
                                            <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1">Fajwa Al-Nisab (فجوة النصاب)</p>
                                            <p className="text-lg font-black text-destructive">-{formatCurrency(nisabGap)}</p>
                                            <p className="text-[8px] text-muted-foreground italic mt-1 uppercase">Manque à gagner pour atteindre le seuil de وجوب</p>
                                        </div>
                                    )}

                                    <div className={cn(
                                        "p-6 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-700 shadow-xl",
                                        result.isNisabReached ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-muted/30 border-white/10 text-muted-foreground"
                                    )}>
                                        {result.isNisabReached ? <CheckCircle2 className="h-8 w-8 shrink-0" /> : <AlertCircle className="h-8 w-8 shrink-0" />}
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black uppercase tracking-widest">{result.isNisabReached ? 'Nisab Atteint' : 'Nisab non Atteint'}</p>
                                            <p className="text-[10px] italic leading-tight font-medium">
                                                {result.isNisabReached ? "La فريضة est applicable sur votre patrimoine." : "Assiette inférieure au seuil légal."}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-10 bg-white/5 border-t border-white/5 relative z-10">
                                    <Button onClick={handleSave} disabled={isSaving || !result.isNisabReached} className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] gap-4 shadow-2xl shadow-emerald-500/30 group hover:scale-105 active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>} 
                                        Graver le Point de Calcul
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-white/5 border-b border-white/5 py-6 px-8"><CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3"><PieChartIcon className="h-5 w-5 text-primary" />Composition des Actifs</CardTitle></CardHeader>
                            <CardContent className="h-80 w-full pt-8">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" animationDuration={1500}>
                                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(26, 18, 12, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px' }} formatter={(val: number) => formatCurrency(val)} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-full flex items-center justify-center opacity-20 grayscale"><BarChart3 className="h-16 w-16" /></div>}
                            </CardContent>
                        </Card>
                        
                        <div className="space-y-8">
                            <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center space-y-6 shadow-inner h-full">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl"><BookOpen className="h-8 w-8 text-emerald-500" /></div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black uppercase tracking-tight italic">Principes de Souveraineté Zakátique</p>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-md uppercase font-bold opacity-70">
                                        Le calcul déterministe soustrait vos passifs exigibles (dettes fournisseurs و charges) de vos actifs circulants (stocks + cash + créances actives). 
                                        Référence Or Marché: <span className="font-black text-emerald-500">{formatCurrency(zakatData.goldPrice)}/g</span>.
                                    </p>
                                </div>
                                <Badge variant="outline" className="h-10 px-6 rounded-xl border-emerald-500/20 text-emerald-500 font-black uppercase text-[9px] tracking-widest bg-background/40"><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Audit iPOS Deterministe Active</Badge>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in slide-in-from-bottom-4 duration-700 outline-none space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                        <div className="flex items-center gap-2 px-4 py-2 bg-background/40 rounded-xl border border-white/10">
                            <History className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{zakatHistory.length} Points de calcul archivés</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleExport} disabled={zakatHistory.length === 0} className="h-10 rounded-xl border-white/5 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-white/5 transition-all">
                                <FileUp className="h-4 w-4" /> 
                                Exporter CSV
                            </Button>
                            <div className="flex items-center gap-1 rounded-xl bg-background/40 p-1 border border-white/10 shadow-inner">
                                <Button variant={historyViewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setHistoryViewMode('grid')}>
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button variant={historyViewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setHistoryViewMode('list')}>
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {zakatHistory.length === 0 ? (
                        <div className="py-40 text-center opacity-30 grayscale border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5 space-y-6">
                            <div className="h-24 w-24 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center mx-auto">
                                <History className="h-12 w-12 text-primary" />
                            </div>
                            <p className="text-2xl font-black uppercase tracking-widest">Archives Vierges</p>
                        </div>
                    ) : historyViewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                            {zakatHistory.map(h => (
                                <Card key={h.uuid} className="luxury-glass p-8 border-white/5 bg-muted/10 hover:border-emerald-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-64 cursor-pointer shadow-xl" onClick={() => handleViewHistory(h)}>
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                        <Scale className="h-24 w-24 rotate-12" />
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                                            <History className="h-3 w-3 text-emerald-500" />
                                            {new Date(h.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <p className="text-3xl font-black text-emerald-500 tracking-tighter">{formatCurrency(h.zakatAmount)}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest">Base: {formatCurrency(h.zakatBase)}</p>
                                    </div>
                                    <div className="relative z-10 pt-6 border-t border-white/5 mt-4">
                                        <Button variant="ghost" className="w-full rounded-xl h-10 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-emerald-500/10">
                                            Audit Détails <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <ZakatHistoryTable history={zakatHistory} onViewDetails={handleViewHistory} />
                    )}
                </TabsContent>
            </Tabs>

            <ZakatHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} calculation={selectedHistory} />
            <div className="hidden">{result && <ZakatReport ref={reportRef} calculation={result} profile={profile} />}</div>
        </div>
    );
}
