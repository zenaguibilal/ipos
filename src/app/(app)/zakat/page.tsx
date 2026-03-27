'use client';

import { useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { Printer, RefreshCw, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore, useAppActions } from '@/stores/appStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * @fileOverview Zakat Calculator Page (Deterministic Singularity)
 * Phase 7 & 11 Compliance: Components are for RENDERING ONLY.
 * Computation is derived from the Store.
 */

export default function ZakatPage() {
    const { history, isLoading, zakatData, zakatInputs, result, isSaving } = useAppStore(state => ({
        history: state.zakatHistory,
        isLoading: state.isLoading.zakat,
        isSaving: state.isLoading.zakatSaving,
        zakatData: state.zakat.autoData,
        zakatInputs: state.zakat.inputs,
        result: state.zakat.result
    }));
    const { refreshZakatData, setZakatInputs, saveZakatCalculation } = useAppActions();

    useEffect(() => { refreshZakatData(); }, [refreshZakatData]);

    const handleSave = async () => {
        if (!result) return;
        try {
            await saveZakatCalculation(result);
            toast.success("Point de calcul archivé.");
        } catch (error) { 
            toast.error("Échec de l'archivage."); 
        }
    };

    if (isLoading && history.length === 0) return <div className="p-6"><Skeleton className="h-12 w-1/3 mb-6"/><div className="grid grid-cols-3 gap-6"><Skeleton className="h-64"/><Skeleton className="h-64"/><Skeleton className="h-64"/></div></div>;

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            <PageHeader title="Calculateur de Zakat" description="Évaluation des actifs nets pour le commerce.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refreshZakatData()} disabled={isLoading} className="luxury-glass border-white/10"><RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Actualiser</Button>
                    <Button className="bg-primary shadow-lg shadow-primary/20"><Printer className="h-4 w-4 mr-2" /> Rapport PDF</Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="calculator">
                <TabsList className="mb-8 p-1.5 luxury-glass h-auto bg-muted/20 border-white/5">
                    <TabsTrigger value="calculator" className="rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">Évaluation</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary transition-all">Archives</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calculator" className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="luxury-glass border-white/5 bg-muted/10">
                            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Actifs (Éléments du calcul)</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Valeur des Stocks</Label>
                                    <p className="text-2xl font-black">{formatCurrency(zakatData.inventoryValue)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">Liquidités en Caisse (DA)</Label>
                                    <Input 
                                        type="number" 
                                        value={zakatInputs.cashOnHand || ''} 
                                        onChange={(e) => setZakatInputs({ cashOnHand: Number(e.target.value) })} 
                                        className="h-12 text-xl font-bold bg-background/50 rounded-xl border-white/10" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="luxury-glass border-white/5 bg-muted/10">
                            <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Passifs (Dettes à déduire)</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Dettes Fournisseurs</Label>
                                    <p className="text-2xl font-black text-destructive">{formatCurrency(zakatData.supplierDebts)}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-2">Autres Dettes (Charges, etc.)</Label>
                                    <Input 
                                        type="number" 
                                        value={zakatInputs.otherDebts || ''} 
                                        onChange={(e) => setZakatInputs({ otherDebts: Number(e.target.value) })} 
                                        className="h-12 text-xl font-bold bg-background/50 rounded-xl border-white/10" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {result && (
                            <Card className={cn("luxury-glass border-2 overflow-hidden transition-all duration-700", result.isNisabReached ? "border-chart-quaternary bg-chart-quaternary/5" : "border-white/5 bg-muted/10")}>
                                <CardHeader className="text-center bg-white/5 pb-6">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Résultat de l'Évaluation</CardTitle>
                                    <p className="text-4xl font-black tracking-tighter">{formatCurrency(result.zakatBase)}</p>
                                    <p className="text-[10px] mt-2 font-bold uppercase opacity-60">Base Imposable Nette</p>
                                </CardHeader>
                                <CardContent className="text-center pt-8 space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Nisab Actuel (85g)</p>
                                        <p className="text-lg font-bold">{formatCurrency(result.nisab)}</p>
                                    </div>
                                    <div className="h-px bg-white/5 w-1/2 mx-auto" />
                                    <div>
                                        <p className="text-xs font-black text-chart-quaternary uppercase tracking-widest mb-1">Montant à Verser (2.5%)</p>
                                        <p className="text-4xl font-black text-chart-quaternary">{formatCurrency(result.zakatAmount)}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 border-t border-white/5">
                                    <Button onClick={handleSave} disabled={isSaving || !result.isNisabReached} className="w-full h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 bg-chart-quaternary hover:bg-chart-quaternary/90 shadow-lg shadow-chart-quaternary/20">
                                        {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>} 
                                        Archiver le Point
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {history.map(h => (
                            <Card key={h.uuid} className="luxury-glass p-6 border-white/5 bg-muted/10 hover:border-primary/20 transition-all group">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 group-hover:text-primary transition-colors">{new Date(h.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-2xl font-black text-primary">{formatCurrency(h.zakatAmount)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Sur une base de {formatCurrency(h.zakatBase)}</p>
                            </Card>
                        ))}
                        {history.length === 0 && (
                            <div className="col-span-full py-24 text-center text-muted-foreground italic border-2 border-dashed rounded-[3rem] border-white/5 bg-white/5">
                                Aucun historique de calcul archivé.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
