
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { formatCurrency, cn } from '@/lib/utils';
import { Coins, Printer, RefreshCw, HandHelping, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SavedZakatCalculation, ZakatCalculation } from '@/lib/types';

// Logic moved to a shared static method in ZakatRepository, but we need a client version for live preview
const calculateZakat = (data: any): ZakatCalculation => {
    const nisab = (data.goldPrice || 0) * 85;
    const totalAssets = (data.inventoryValue || 0) + Math.max(0, (data.customerDebts || 0) - (data.badDebts || 0)) + (data.cashOnHand || 0);
    const totalLiabilities = (data.supplierDebts || 0) + (data.otherDebts || 0);
    const zakatBase = Math.max(0, totalAssets - totalLiabilities);
    const isNisabReached = nisab > 0 && zakatBase >= nisab;
    return { ...data, nisab, zakatBase, zakatAmount: isNisabReached ? zakatBase * 0.025 : 0, isNisabReached };
};

export default function ZakatPage() {
    const profile = useAppStore(state => state.profile);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [history, setHistory] = useState<SavedZakatCalculation[]>([]);
    const [cashOnHand, setCashOnHand] = useState<number>(0);
    const [otherDebts, setOtherDebts] = useState<number>(0);
    const [badDebts, setBadDebts] = useState<number>(0);
    
    const [autoData, setAutoData] = useState({ inventoryValue: 0, customerDebts: 0, supplierDebts: 0, goldPrice: 0 });

    const fetchData = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const [data, hist] = await Promise.all([
                api.get<any>('zakat'),
                api.get<SavedZakatCalculation[]>('zakat?type=history')
            ]);
            setAutoData(data);
            setHistory(hist);
        } catch (error) {
            toast.error("Échec du chargement.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const result = useMemo(() => calculateZakat({ ...autoData, cashOnHand, otherDebts, badDebts }), [autoData, cashOnHand, otherDebts, badDebts]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post('zakat', result);
            toast.success("Point de calcul archivé.");
            fetchData(true);
        } catch (error) { toast.error("Échec de l'archivage."); }
        finally { setIsSaving(false); }
    };

    if (isLoading) return <div className="p-6"><Skeleton className="h-12 w-1/3 mb-6"/><div className="grid grid-cols-3 gap-6"><Skeleton className="h-64"/><Skeleton className="h-64"/><Skeleton className="h-64"/></div></div>;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader title="Calculateur de Zakat" description="Évaluation des actifs nets pour le commerce.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing}><RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} /> Actualiser</Button>
                    <Button className="bg-primary"><Printer className="h-4 w-4 mr-2" /> PDF</Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="calculator">
                <TabsList className="mb-8"><TabsTrigger value="calculator">Évaluation</TabsTrigger><TabsTrigger value="history">Archives</TabsTrigger></TabsList>
                <TabsContent value="calculator" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="luxury-glass">
                            <CardHeader><CardTitle className="text-sm">Actifs</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div><Label className="text-[10px] font-black uppercase">Stocks</Label><p className="text-2xl font-black">{formatCurrency(autoData.inventoryValue)}</p></div>
                                <div><Label className="text-[10px] font-black uppercase">Liquidités</Label><Input type="number" value={cashOnHand || ''} onChange={(e) => setCashOnHand(Number(e.target.value))} /></div>
                            </CardContent>
                        </Card>
                        <Card className="luxury-glass">
                            <CardHeader><CardTitle className="text-sm">Passifs</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div><Label className="text-[10px] font-black uppercase">Dettes Fournisseurs</Label><p className="text-2xl font-black">{formatCurrency(autoData.supplierDebts)}</p></div>
                                <div><Label className="text-[10px] font-black uppercase">Autres Dettes</Label><Input type="number" value={otherDebts || ''} onChange={(e) => setOtherDebts(Number(e.target.value))} /></div>
                            </CardContent>
                        </Card>
                        <Card className={cn("luxury-glass border-2", result.isNisabReached && "border-chart-quaternary bg-chart-quaternary/5")}>
                            <CardHeader className="text-center"><CardTitle className="text-lg">Base Imposable</CardTitle></CardHeader>
                            <CardContent className="text-center">
                                <p className="text-4xl font-black">{formatCurrency(result.zakatBase)}</p>
                                <p className="text-xs mt-2 text-muted-foreground">Nisab: {formatCurrency(result.nisab)}</p>
                            </CardContent>
                            <CardFooter className="flex flex-col">
                                <p className="text-3xl font-black text-chart-quaternary">{formatCurrency(result.zakatAmount)}</p>
                                <Button onClick={handleSave} disabled={isSaving || !result.isNisabReached} className="mt-4 w-full">
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4 mr-2"/>} Archiver
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="history">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {history.map(h => <Card key={h.uuid} className="luxury-glass p-4"><p className="font-bold">{new Date(h.createdAt).toLocaleDateString()}</p><p className="text-xl font-black text-primary">{formatCurrency(h.zakatAmount)}</p></Card>)}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
