
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
    Users, 
    Banknote, 
    ArrowRight, 
    Printer, 
    RefreshCw, 
    Info, 
    AlertTriangle, 
    HandHelping,
    UserX,
    TrendingUp,
    Save,
    History as HistoryIcon,
    Trash2,
    Loader2,
    FileText,
    Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip } from 'recharts';
import type { SavedZakatCalculation } from '@/lib/types';

export default function ZakatPage() {
    const profile = useAppStore(state => state.profile);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [history, setHistory] = useState<SavedZakatCalculation[]>([]);
    
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

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setIsLoading(true);
        
        try {
            const [data, hist] = await Promise.all([
                zakatService.getAutomaticData(),
                zakatService.getHistory()
            ]);
            setAutoData(data);
            setHistory(hist);
        } catch (error) {
            toast.error("Impossible de charger les بيانات.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const result = useMemo(() => {
        return zakatService.calculate({
            ...autoData,
            cashOnHand,
            otherDebts,
            badDebts
        });
    }, [autoData, cashOnHand, otherDebts, badDebts]);

    const chartData = useMemo(() => [
        { name: 'Stock', value: autoData.inventoryValue, color: 'hsl(var(--primary))' },
        { name: 'Créances', value: Math.max(0, autoData.customerDebts - badDebts), color: 'hsl(var(--chart-quaternary))' },
        { name: 'Liquidités', value: cashOnHand, color: 'hsl(var(--chart-secondary))' },
    ], [autoData, badDebts, cashOnHand]);

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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await zakatService.saveCalculation(result);
            toast.success("Calcul de Zakat sauvegardé.");
            await fetchData(true);
        } catch (error) {
            toast.error("Échec de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRecord = async (uuid: string) => {
        try {
            await zakatService.deleteRecord(uuid);
            toast.success("Enregistrement supprimé.");
            setHistory(prev => prev.filter(h => h.uuid !== uuid));
        } catch (error) {
            toast.error("Erreur de suppression.");
        }
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
    const nisabProgress = Math.min((result.zakatBase / (result.nisab || 1)) * 100, 100);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader 
                title="Calculateur de Zakat Commerciale"
                description="Évaluez vos actifs nets et déterminez le montant de votre Zakat annuelle."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing} className="flex-1 sm:none luxury-glass border-primary/20">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Actualiser
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl flex-1 sm:none">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer Rapport A4
                    </Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 luxury-glass p-1.5 bg-muted/20 border-white/5">
                    <TabsTrigger value="calculator" className="gap-2 rounded-xl py-2.5 font-bold data-[state=active]:bg-background">
                        <TrendingUp className="h-4 w-4" /> Calculateur
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 rounded-xl py-2.5 font-bold data-[state=active]:bg-background">
                        <HistoryIcon className="h-4 w-4" /> Historique
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-8 animate-in fade-in-50 duration-500">
                    {goldPriceWarning && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-pulse">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-bold">
                                Attention : Le سعر الذهب (Prix de l'or) n'est pas configuré. 
                                Metteز-le à jour dans votre <a href="/profile" className="underline font-black">Profil</a>.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Assets Column */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
                                <Coins className="h-4 w-4" /> الأصول (Actifs)
                            </h3>
                            
                            <Card className="luxury-glass border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">عروض التجارة (Stock)</CardTitle>
                                            <CardDescription className="text-[10px] uppercase font-bold">Valeur d'achat totale</CardDescription>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Info className="h-3 w-3" /></Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="luxury-glass">
                                                    <p className="text-xs">Calculé sur la base de (Quantité x Prix d'Achat)</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-black text-primary">{formatCurrency(autoData.inventoryValue)}</p>
                                </CardContent>
                            </Card>

                            <Card className="luxury-glass border-primary/10 bg-primary/5 shadow-inner">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" /> الديون المرجوة (Créances)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-primary/10 pb-2">
                                        <span className="text-muted-foreground font-medium">Total Dettes Client :</span>
                                        <span className="font-bold">{formatCurrency(autoData.customerDebts)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bad-debts" className="text-[10px] font-black uppercase flex items-center gap-1.5 text-destructive">
                                            <UserX className="h-3 w-3" /> الخصم: ديون مشكوك فيها
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                id="bad-debts"
                                                type="number" 
                                                value={badDebts || ''} 
                                                onChange={(e) => setBadDebts(Number(e.target.value))}
                                                className="h-10 text-lg font-black rounded-xl border-destructive/20"
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
                                        <Banknote className="h-4 w-4 text-primary" /> السيولة (Liquidités)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={cashOnHand || ''} 
                                            onChange={(e) => setCashOnHand(Number(e.target.value))}
                                            className="h-14 text-2xl font-black rounded-xl border-primary/20 bg-background/50 focus:border-primary shadow-inner"
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
                                <ArrowRight className="h-4 w-4" /> الخصوم (Passifs)
                            </h3>

                            <Card className="luxury-glass border-destructive/10 hover:border-destructive/30 transition-all group overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">ديون الموردين (Fournisseurs)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-black text-destructive">{formatCurrency(autoData.supplierDebts)}</p>
                                </CardContent>
                            </Card>

                            <Card className="luxury-glass bg-destructive/5 border-destructive/20 shadow-inner">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" /> التزامات أخرى (Charges)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400">قاعدة النصاب (85g Or)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium italic">Prix Or (1g) :</span>
                                        <span className="font-bold">{formatCurrency(autoData.goldPrice)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-blue-500/10 pt-2">
                                        <span className="text-muted-foreground font-medium italic">Seuil du النصاب :</span>
                                        <span className="font-black text-blue-400 text-lg">{formatCurrency(result.nisab)}</span>
                                    </div>
                                    <Progress value={nisabProgress} className="h-1.5" />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Final Result Column */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary flex items-center gap-2 px-2">
                                <HandHelping className="h-4 w-4" /> النتيجة النهائية (2.5%)
                            </h3>

                            <Card className={cn(
                                "luxury-glass border-2 overflow-hidden relative theme-transition shadow-2xl",
                                result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5 scale-105" : "border-muted bg-muted/5 opacity-80"
                            )}>
                                <CardHeader>
                                    <CardTitle className="text-lg font-black uppercase tracking-tight text-center">وعاء الزكاة (Base imposable)</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 flex flex-col items-center">
                                    <p className={cn(
                                        "text-5xl font-black tracking-tighter mb-6",
                                        result.isNisabReached ? "text-chart-quaternary" : "text-foreground"
                                    )}>
                                        {formatCurrency(result.zakatBase)}
                                    </p>
                                    
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={chartData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <ReTooltip />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                                
                                {result.isNisabReached ? (
                                    <CardFooter className="bg-chart-quaternary p-8 border-t-0 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 mb-2 text-center">مقدار الزكاة المستحقة</p>
                                        <p className="text-5xl font-black text-white drop-shadow-xl animate-in zoom-in-90 duration-500">
                                            {formatCurrency(result.zakatAmount)}
                                        </p>
                                        <div className="mt-6 flex gap-2 w-full">
                                            <Button 
                                                variant="secondary" 
                                                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/10"
                                                onClick={handleSave}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                Sauvegarder
                                            </Button>
                                        </div>
                                    </CardFooter>
                                ) : (
                                    <CardFooter className="p-6 justify-center">
                                        <p className="text-sm font-bold text-muted-foreground text-center italic">Le patrimoine net est inférieur au seuil du نصاب.</p>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((record) => (
                            <Card key={record.uuid} className="luxury-glass border-white/5 group overflow-hidden">
                                <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold font-mono">
                                            {format(record.createdAt, 'dd MMMM yyyy', { locale: fr })}
                                        </CardTitle>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteRecord(record.uuid)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">وعاء الزكاة :</span>
                                        <span className="font-bold">{formatCurrency(record.zakatBase)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">الزكاة المستحقة :</span>
                                        <span className="font-black text-chart-quaternary text-lg">{formatCurrency(record.zakatAmount)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-2">
                                    <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] font-black uppercase gap-2 hover:bg-white/10">
                                        <FileText className="h-3 w-3" /> Voir le détail
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {history.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-white/10 bg-white/5">
                                <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground font-medium">Aucun historique de calcul enregistré.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Printable Report Hidden Layout */}
            <div id="zakat-report" className="hidden p-12 bg-white text-black font-sans min-h-[297mm] relative">
                <header className="flex justify-between items-start mb-12 border-b-2 border-black pb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.companyName || 'Mon Établissement'}</h1>
                        <p className="text-xs font-bold text-gray-600">{profile?.address}, {profile?.city}</p>
                        <p className="text-xs font-bold text-gray-600">Tél: {profile?.phone}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-black text-white px-4 py-2 inline-block font-black text-lg uppercase tracking-widest mb-2">RAPPORT DE ZAKAT</div>
                        <p className="text-xs font-bold mt-1">Généré le: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-16 mb-12">
                    <div className="space-y-6">
                        <h2 className="font-black border-b-2 border-black text-sm uppercase pb-2 flex items-center justify-between">
                            <span>📦 الأصول (Actifs)</span>
                            <Coins className="h-4 w-4" />
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>Stock (Valeur achat)</span> <span className="font-bold">{formatCurrency(autoData.inventoryValue)}</span></div>
                            <div className="flex justify-between"><span>Liquidités & Banques</span> <span className="font-bold">{formatCurrency(cashOnHand)}</span></div>
                            <div className="flex justify-between"><span>Créances Clients Nettes</span> <span className="font-bold">{formatCurrency(autoData.customerDebts - badDebts)}</span></div>
                            <div className="h-px bg-gray-200 w-full" />
                            <div className="flex justify-between font-black text-lg pt-2">
                                <span>TOTAL ACTIFS</span> 
                                <span>{formatCurrency(autoData.inventoryValue + cashOnHand + (autoData.customerDebts - badDebts))}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h2 className="font-black border-b-2 border-black text-sm uppercase pb-2 flex items-center justify-between">
                            <span>⚖️ الخصوم (Passifs)</span>
                            <Scale className="h-4 w-4" />
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>Dettes Fournisseurs</span> <span className="font-bold text-red-600">{formatCurrency(autoData.supplierDebts)}</span></div>
                            <div className="flex justify-between"><span>Autres Charges & Dettes</span> <span className="font-bold text-red-600">{formatCurrency(otherDebts)}</span></div>
                            <div className="h-px bg-gray-200 w-full" />
                            <div className="flex justify-between font-black text-lg pt-2">
                                <span>TOTAL PASSIFS</span> 
                                <span>{formatCurrency(autoData.supplierDebts + otherDebts)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 bg-gray-50 border-2 border-black p-10 rounded-[3rem] text-center space-y-8">
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <span className="font-black uppercase text-xs tracking-[0.2em] text-gray-500">Base Imposable (وعاء الزكاة)</span>
                            <p className="text-5xl font-black">{formatCurrency(result.zakatBase)}</p>
                        </div>
                        
                        <div className="pt-6">
                            {result.isNisabReached ? (
                                <div className="space-y-4">
                                    <div className="bg-green-100 text-green-800 py-2 rounded-full inline-block px-10 text-xs font-black uppercase tracking-widest border border-green-200">
                                        النصاب مستوفى (Zakat Obligatoire)
                                    </div>
                                    <div className="p-8 bg-gray-900 text-white rounded-[2rem] shadow-2xl relative overflow-hidden text-center">
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Montant de la Zakat à reverser (2.5%)</p>
                                        <p className="text-6xl font-black">{formatCurrency(result.zakatAmount)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 border-2 border-dashed border-gray-300 rounded-[2.5rem]">
                                    <p className="font-black text-lg uppercase tracking-tight text-gray-400 mb-2">Zakat Non Exigible</p>
                                    <p className="text-sm italic text-gray-500 font-medium">Le patrimoine net est inférieur au seuil du نصاب.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <footer className="absolute bottom-12 left-12 right-12 pt-6 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    <p>Système iPOS Cloud Management - Rapport Officiel</p>
                    <p>Document Confidentiel</p>
                </footer>
            </div>
        </div>
    );
}
