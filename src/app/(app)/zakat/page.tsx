
'use client';

/**
 * @fileOverview Zakat Module Page
 * Performs calculation of Zakat based on live inventory, receivables, and gold course.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { zakatService } from '@/services/zakat.service';
import { formatCurrency, cn } from '@/lib/utils';
import { 
    Coins, Banknote, ArrowRight, Printer, RefreshCw, 
    HandHelping, History as HistoryIcon, Save, Loader2, Scale 
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
    const [cashOnHand, setCashOnHand] = useState(0);
    const [otherDebts, setOtherDebts] = useState(0);
    const [badDebts, setBadDebts] = useState(0);
    
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
            toast.error("Données zakat inaccessibles.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const result = useMemo(() => {
        return zakatService.calculate({ ...autoData, cashOnHand, otherDebts, badDebts });
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
            toast.success("Calcul archivé.");
            await fetchData(true);
        } catch (error) { toast.error("Échec de l'archivage."); }
        finally { setIsSaving(false); }
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-12 w-1/3 rounded-xl" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    const nisabProgress = Math.min((result.zakatBase / (result.nisab || 1)) * 100, 100);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader title="Calculateur de Zakat" description="Maîtrisez votre conformité religieuse et financière.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing} className="luxury-glass">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} /> Actualiser
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                        <Printer className="h-4 w-4 mr-2" /> Rapport A4
                    </Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 luxury-glass p-1 bg-muted/20 border-white/5">
                    <TabsTrigger value="calculator" className="rounded-lg py-2 font-bold data-[state=active]:bg-background">Calculateur</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg py-2 font-bold data-[state=active]:bg-background">Historique</TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-2">
                                <Coins className="h-4 w-4" /> الأصول (ACTIFS)
                            </h3>
                            <Card className="luxury-glass border-primary/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">عروض التجارة (Stock)</CardTitle>
                                    <CardDescription className="text-[10px] uppercase">Valeur d'achat cumulée</CardDescription>
                                </CardHeader>
                                <CardContent><p className="text-3xl font-black text-primary">{formatCurrency(autoData.inventoryValue)}</p></CardContent>
                            </Card>
                            <Card className="luxury-glass border-primary/10 bg-primary/5">
                                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">الديون المرجوة (Créances)</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-xs border-b pb-2"><span>Dettes clients :</span><span className="font-bold">{formatCurrency(autoData.customerDebts)}</span></div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-destructive font-black">ديون مشكوك فيها (Déduction)</Label>
                                        <Input type="number" value={badDebts || ''} onChange={(e) => setBadDebts(Number(e.target.value))} className="h-9 font-black" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="luxury-glass bg-primary/5 border-primary/20">
                                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">السيولة (Liquidités)</CardTitle></CardHeader>
                                <CardContent>
                                    <Input type="number" value={cashOnHand || ''} onChange={(e) => setCashOnHand(Number(e.target.value))} className="h-12 text-xl font-black" placeholder="Cash en caisse / banque..." />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2 px-2">
                                <ArrowRight className="h-4 w-4" /> الخصوم (PASSIFS)
                            </h3>
                            <Card className="luxury-glass border-destructive/10">
                                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">ديون الموردين (Fournisseurs)</CardTitle></CardHeader>
                                <CardContent><p className="text-3xl font-black text-destructive">{formatCurrency(autoData.supplierDebts)}</p></CardContent>
                            </Card>
                            <Card className="luxury-glass bg-destructive/5 border-destructive/20">
                                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">التزامات أخرى (Charges)</CardTitle></CardHeader>
                                <CardContent>
                                    <Input type="number" value={otherDebts || ''} onChange={(e) => setOtherDebts(Number(e.target.value))} className="h-12 text-xl font-black" placeholder="Salaires, loyers dus..." />
                                </CardContent>
                            </Card>
                            <Card className="luxury-glass border-blue-500/10 bg-blue-500/5">
                                <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase font-black text-blue-400">قاعدة النصاب (85g OR)</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-xs"><span>Prix Or (1g) :</span><span className="font-bold">{formatCurrency(autoData.goldPrice)}</span></div>
                                    <div className="flex justify-between text-xs border-t pt-2"><span>Seuil du نصاب :</span><span className="font-black text-blue-400">{formatCurrency(result.nisab)}</span></div>
                                    <Progress value={nisabProgress} className="h-1.5" />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary flex items-center gap-2 px-2">
                                <HandHelping className="h-4 w-4" /> النتيجة (2.5%)
                            </h3>
                            <Card className={cn("luxury-glass border-2 overflow-hidden shadow-2xl", result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5" : "opacity-80")}>
                                <CardHeader><CardTitle className="text-lg font-black text-center uppercase">وعاء الزكاة (Base)</CardTitle></CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <p className={cn("text-5xl font-black mb-6", result.isNisabReached ? "text-chart-quaternary" : "text-foreground")}>{formatCurrency(result.zakatBase)}</p>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {chartData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                                                </Pie>
                                                <ReTooltip />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                                {result.isNisabReached ? (
                                    <CardFooter className="bg-chart-quaternary p-8 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase text-white/80 mb-2">الزكاة المستحقة</p>
                                        <p className="text-5xl font-black text-white">{formatCurrency(result.zakatAmount)}</p>
                                        <Button variant="secondary" className="mt-6 w-full bg-white/20 hover:bg-white/30 text-white" onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Sauvegarder
                                        </Button>
                                    </CardFooter>
                                ) : (
                                    <CardFooter className="p-6 justify-center"><p className="text-sm font-bold text-muted-foreground italic text-center">Patrimoine net inférieur au seuil du نصاب.</p></CardFooter>
                                )}
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((record) => (
                            <Card key={record.uuid} className="luxury-glass border-white/5 overflow-hidden">
                                <CardHeader className="pb-3 border-b border-white/5">
                                    <CardTitle className="text-sm font-bold">{format(new Date(record.createdAt), 'dd MMMM yyyy', { locale: fr })}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between text-xs"><span>Base imposable :</span><span className="font-bold">{formatCurrency(record.zakatBase)}</span></div>
                                    <div className="flex justify-between text-xs"><span>Montant payé :</span><span className="font-black text-chart-quaternary">{formatCurrency(record.zakatAmount)}</span></div>
                                </CardContent>
                            </Card>
                        ))}
                        {history.length === 0 && <div className="col-span-full py-20 text-center opacity-20"><HistoryIcon className="h-12 w-12 mx-auto" /><p>Aucun historique.</p></div>}
                    </div>
                </TabsContent>
            </Tabs>

            <div id="zakat-report" className="hidden p-12 bg-white text-black font-sans">
                <header className="border-b-2 border-black pb-8 mb-8 flex justify-between">
                    <div><h1 className="text-3xl font-black">{profile?.companyName}</h1><p className="text-sm">{profile?.address}</p></div>
                    <div className="text-right font-black uppercase text-xl">Rapport Annuel de Zakat</div>
                </header>
                <div className="grid grid-cols-2 gap-8">
                    <div><h2 className="font-black border-b border-black mb-4">الأصول (Actifs)</h2><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Stock</span><span>{formatCurrency(autoData.inventoryValue)}</span></div><div className="flex justify-between"><span>Liquidités</span><span>{formatCurrency(cashOnHand)}</span></div><div className="flex justify-between"><span>Créances</span><span>{formatCurrency(autoData.customerDebts - badDebts)}</span></div></div></div>
                    <div><h2 className="font-black border-b border-black mb-4">الخصوم (Passifs)</h2><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Dettes Fournisseurs</span><span>{formatCurrency(autoData.supplierDebts)}</span></div><div className="flex justify-between"><span>Charges dues</span><span>{formatCurrency(otherDebts)}</span></div></div></div>
                </div>
                <div className="mt-12 p-8 bg-gray-100 rounded-3xl text-center"><p className="text-xs font-black text-gray-500 uppercase">Base imposable finale</p><p className="text-4xl font-black">{formatCurrency(result.zakatBase)}</p><div className="mt-4"><p className="text-lg font-black text-green-700">Montant de la Zakat (2.5%) : {formatCurrency(result.zakatAmount)}</p></div></div>
                <footer className="mt-20 border-t pt-4 text-[10px] text-gray-400 flex justify-between"><span>Document certifié iPOS</span><span>Signature Etablissement</span></footer>
            </div>
        </div>
    );
}
