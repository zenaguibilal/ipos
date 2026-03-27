'use client';

/**
 * @fileOverview Professional Zakat Financial Assessment Tool
 * Optimized for performance and strictly typed calculation logic.
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
    Coins, ArrowRight, Printer, RefreshCw, 
    HandHelping, History as HistoryIcon, Save, Loader2, 
    BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip } from 'recharts';
import type { SavedZakatCalculation } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function ZakatPage() {
    const profile = useAppStore(state => state.profile);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [history, setHistory] = useState<SavedZakatCalculation[]>([]);
    const [cashOnHand, setCashOnHand] = useState<number>(0);
    const [otherDebts, setOtherDebts] = useState<number>(0);
    const [badDebts, setBadDebts] = useState<number>(0);
    
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
            toast.error("Échec du chargement des données Zakat.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

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
        setTimeout(() => window.print(), 150);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await zakatService.saveCalculation(result);
            toast.success("Point de calcul archivé avec succès.");
            await fetchData(true);
        } catch (error) { 
            toast.error("Échec de l'archivage."); 
        } finally { 
            setIsSaving(false); 
        }
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
            <PageHeader title="Calculateur de Zakat Professionnelle" description="Évaluez vos actifs nets et déterminez le montant de la Zakat Al-Maal pour votre commerce.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing} className="luxury-glass">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} /> 
                        Actualiser
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg transition-all hover:scale-105">
                        <Printer className="h-4 w-4 mr-2" /> 
                        Générer Rapport PDF
                    </Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 luxury-glass bg-muted/20">
                    <TabsTrigger value="calculator" className="font-bold uppercase text-[10px] tracking-widest">Évaluation Actuelle</TabsTrigger>
                    <TabsTrigger value="history" className="font-bold uppercase text-[10px] tracking-widest">Historique Archivé</TabsTrigger>
                </TabsList>

                <TabsContent value="calculator" className="space-y-8 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Coins className="h-4 w-4" /> 1. Actifs Commercialement Imposables
                            </h3>
                            <Card className="luxury-glass border-primary/10 overflow-hidden group">
                                <CardHeader className="pb-3 bg-primary/5">
                                    <CardTitle className="text-sm font-bold">Valeur des Stocks</CardTitle>
                                    <CardDescription>Évaluée au prix de vente actuel</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-3xl font-black text-primary">{formatCurrency(autoData.inventoryValue)}</p>
                                </CardContent>
                            </Card>
                            
                            <Card className="luxury-glass border-primary/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">Créances Clients (Dettes Dues)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                                        <span className="text-muted-foreground">Total facturé :</span>
                                        <span className="font-bold">{formatCurrency(autoData.customerDebts)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-destructive font-black">Déduction : Créances Irrécouvrables</Label>
                                        <Input 
                                            type="number" 
                                            value={badDebts || ''} 
                                            onChange={(e) => setBadDebts(Math.abs(Number(e.target.value)))} 
                                            className="font-black h-10 border-destructive/20 focus:border-destructive" 
                                            placeholder="Montant des dettes perdues..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="luxury-glass border-primary/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">Liquidités & Disponibilités</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-black">Fonds en Caisse & Banques</Label>
                                        <Input 
                                            type="number" 
                                            value={cashOnHand || ''} 
                                            onChange={(e) => setCashOnHand(Math.abs(Number(e.target.value)))} 
                                            className="h-12 text-xl font-black bg-background/50" 
                                            placeholder="0.0 DA" 
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" /> 2. Passifs & Dettes à Déduire
                            </h3>
                            <Card className="luxury-glass border-destructive/10 bg-destructive/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">Dettes Fournisseurs</CardTitle>
                                    <CardDescription>Achats de marchandise non réglés</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-black text-destructive">{formatCurrency(autoData.supplierDebts)}</p>
                                </CardContent>
                            </Card>

                            <Card className="luxury-glass border-destructive/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold">Charges & Engagements Dus</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-black">Salaires, Loyers, Factures échues...</Label>
                                        <Input 
                                            type="number" 
                                            value={otherDebts || ''} 
                                            onChange={(e) => setOtherDebts(Math.abs(Number(e.target.value)))} 
                                            className="h-12 text-xl font-black" 
                                            placeholder="0.0 DA" 
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="luxury-glass border-blue-500/10 bg-blue-500/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] uppercase font-black text-blue-400">Référence NISAB (85g OR 24k)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Prix de l'or (1g) :</span>
                                        <span className="font-bold">{formatCurrency(autoData.goldPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-t border-blue-500/10 pt-2">
                                        <span className="text-muted-foreground">Seuil du Nisab :</span>
                                        <span className="font-black text-blue-400">{formatCurrency(result.nisab)}</span>
                                    </div>
                                    <Progress value={nisabProgress} className="h-1.5 bg-blue-500/10" />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary flex items-center gap-2">
                                <HandHelping className="h-4 w-4" /> 3. Synthèse & Assiette (2.5%)
                            </h3>
                            <Card className={cn(
                                "luxury-glass border-2 overflow-hidden transition-all duration-500", 
                                result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5" : "opacity-80"
                            )}>
                                <CardHeader className="text-center">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight">Base Imposable Finale</CardTitle>
                                    <CardDescription>Patrimoine net après déduction des dettes</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center pb-6">
                                    <p className={cn(
                                        "text-5xl font-black mb-6 drop-shadow-sm", 
                                        result.isNisabReached ? "text-chart-quaternary" : "text-foreground"
                                    )}>
                                        {formatCurrency(result.zakatBase)}
                                    </p>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie 
                                                    data={chartData} 
                                                    innerRadius={60} 
                                                    outerRadius={80} 
                                                    paddingAngle={5} 
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <ReTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                                {result.isNisabReached ? (
                                    <CardFooter className="bg-chart-quaternary p-8 flex flex-col items-center rounded-none border-t border-white/10">
                                        <p className="text-[10px] font-black uppercase text-white/80 mb-2">Montant de la Zakat Dûe</p>
                                        <p className="text-5xl font-black text-white">{formatCurrency(result.zakatAmount)}</p>
                                        <Button 
                                            variant="secondary" 
                                            className="mt-6 w-full bg-white/20 hover:bg-white/30 text-white rounded-xl h-12 font-bold transition-all" 
                                            onClick={handleSave} 
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
                                            Archiver ce calcul
                                        </Button>
                                    </CardFooter>
                                ) : (
                                    <CardFooter className="p-6 justify-center bg-muted/20">
                                        <p className="text-sm font-bold text-muted-foreground italic text-center leading-relaxed">
                                            Le patrimoine net est inférieur au seuil du Nisab.<br/>Aucune obligation de Zakat pour cette période.
                                        </p>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.length > 0 ? history.map((record) => (
                            <Card key={record.uuid} className="luxury-glass border-white/5 group hover:border-primary/30 transition-all">
                                <CardHeader className="pb-3 border-b border-white/5">
                                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                                        <span>{format(new Date(record.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                                        <BadgeCheck className="h-4 w-4 text-chart-quaternary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Assiette taxable :</span>
                                        <span className="font-bold">{formatCurrency(record.zakatBase)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Zakat calculée :</span>
                                        <span className="font-black text-chart-quaternary">{formatCurrency(record.zakatAmount)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="col-span-full py-20 text-center opacity-20">
                                <HistoryIcon className="h-12 w-12 mx-auto mb-2" />
                                <p className="font-bold">Aucun archivage disponible.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <div id="zakat-report" className="hidden p-12 bg-white text-black font-sans">
                <header className="border-b-4 border-black pb-8 mb-8 flex justify-between items-start">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black uppercase tracking-tighter">{profile?.companyName || 'Établissement iPOS'}</h1>
                        <p className="text-sm font-bold">{profile?.address}, {profile?.city}</p>
                        <p className="text-sm">Tél: {profile?.phone}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-black uppercase text-2xl px-6 py-3 border-4 border-black inline-block">Bilan Zakat Maal</div>
                        <p className="text-xs mt-3 italic font-bold">Document de synthèse financière — {format(new Date(), 'PPpp', { locale: fr })}</p>
                    </div>
                </header>
                
                <div className="grid grid-cols-2 gap-16 mb-12">
                    <div>
                        <h2 className="font-black border-b-2 border-black mb-6 uppercase text-sm tracking-widest pb-1">ÉTAT DES ACTIFS (A)</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between"><span>Stocks en Inventaire</span><span className="font-bold">{formatCurrency(autoData.inventoryValue)}</span></div>
                            <div className="flex justify-between"><span>Disponibilités en Caisse & Banques</span><span className="font-bold">{formatCurrency(cashOnHand)}</span></div>
                            <div className="flex justify-between"><span>Créances Clientèles (Nettes)</span><span className="font-bold">{formatCurrency(autoData.customerDebts - badDebts)}</span></div>
                            <div className="pt-4 border-t border-dashed border-gray-400 font-black flex justify-between text-lg">
                                <span>TOTAL ACTIFS BRUTS</span>
                                <span>{formatCurrency(autoData.inventoryValue + (autoData.customerDebts - badDebts) + cashOnHand)}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-black border-b-2 border-black mb-6 uppercase text-sm tracking-widest pb-1">ÉTAT DES PASSIFS (B)</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between"><span>Dettes Fournisseurs Cumulées</span><span className="font-bold">{formatCurrency(autoData.supplierDebts)}</span></div>
                            <div className="flex justify-between"><span>Charges & Salaires à Payer</span><span className="font-bold">{formatCurrency(otherDebts)}</span></div>
                            <div className="pt-4 border-t border-dashed border-gray-400 font-black flex justify-between text-lg">
                                <span>TOTAL PASSIFS DÉDUCTIBLES</span>
                                <span>{formatCurrency(autoData.supplierDebts + otherDebts)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 p-10 bg-gray-100 rounded-[3rem] text-center border-4 border-double border-black">
                    <p className="text-xs font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Assiette de la Zakat (A - B)</p>
                    <p className="text-6xl font-black mb-6 tracking-tighter">{formatCurrency(result.zakatBase)}</p>
                    <div className="h-1 bg-black w-1/3 mx-auto my-6"></div>
                    <p className="text-xl font-black text-green-800 uppercase tracking-widest mb-2">MONTANT DE LA ZAKAT À ACQUITTER (2.5%)</p>
                    <p className="text-5xl font-black text-green-900 drop-shadow-sm">{formatCurrency(result.zakatAmount)}</p>
                </div>

                <footer className="mt-32 border-t-2 border-black pt-8 text-[10px] text-gray-500 flex justify-between items-end">
                    <div className="space-y-2">
                        <p className="font-bold">Système iPOS Enterprise — Module Comptabilité Zakat</p>
                        <p className="font-mono">RÉF CALCUL: {uuidv4().substring(0,13).toUpperCase()}</p>
                    </div>
                    <div className="text-center px-16 border-t-2 border-black pt-4">
                        <p className="font-black uppercase text-black text-sm">Sceau et Visa de l'Établissement</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
