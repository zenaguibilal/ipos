
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';
import { 
    Printer, RefreshCw, Scale, History, Info, ShieldAlert, Clock, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ZakatReport } from '@/components/zakat/ZakatReport';
import { ZakatHistoryDialog } from '@/components/zakat/ZakatHistoryDialog';
import { ZakatHistoryTable } from '@/components/zakat/ZakatHistoryTable';
import { ZakatCalculatorForm } from '@/components/zakat/ZakatCalculatorForm';
import { ZakatResultsPanel } from '@/components/zakat/ZakatResultsPanel';
import { ZakatCharts } from '@/components/zakat/ZakatCharts';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CsvImporter } from '@/lib/csv-utils';

/**
 * @fileOverview Zakat Command Center (Architectural Redesign)
 * Separated into modular components for maintainability.
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
    const [printData, setPrintData] = useState<any>(null);

    const isAllowed = profile?.permissions?.includes('zakat') || isManagerOrAdmin;

    useEffect(() => { 
        if (isAllowed) refreshZakatData(); 
    }, [refreshZakatData, isAllowed]);

    const anniversaryInfo = useMemo(() => {
        if (!profile?.zakatAnniversary) return null;
        const anniversary = new Date(profile.zakatAnniversary);
        const daysLeft = differenceInDays(anniversary, new Date());
        return { date: anniversary, daysLeft, label: formatDistanceToNow(anniversary, { addSuffix: true, locale: fr }) };
    }, [profile?.zakatAnniversary]);

    if (!profile || !isAllowed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Vérification des Décrets...</h2>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader title="Calculateur de Zakat" description="Évaluation حتمية des actifs commerciaux و estimation de la فريضة légale.">
                <div className="flex gap-2 w-full sm:w-auto luxury-glass p-1.5 bg-muted/20 border-white/5">
                    <Button variant="outline" onClick={() => refreshZakatData()} disabled={isLoading} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 border-white/10 hover:bg-primary/10">
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} /> Sync
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {anniversaryInfo && (
                    <div className={cn("p-6 rounded-[2.5rem] border-2 flex items-center justify-between gap-6", anniversaryInfo.daysLeft <= 7 ? "bg-destructive/10 border-destructive shadow-2xl" : "luxury-glass border-primary/20 bg-primary/5")}>
                        <div className="flex items-center gap-6">
                            <div className={cn("p-4 rounded-2xl shadow-inner", anniversaryInfo.daysLeft <= 7 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary")}>
                                <Clock className={cn("h-8 w-8", anniversaryInfo.daysLeft <= 7 && "animate-pulse")} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">Vigilance : <span className={anniversaryInfo.daysLeft <= 7 ? "text-destructive" : "text-primary"}>حول الحول</span></h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Échéance : {anniversaryInfo.date.toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                        <p className="text-2xl font-black tracking-tighter">{anniversaryInfo.label}</p>
                    </div>
                )}
            </div>

            <Tabs defaultValue="calculator" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-10 luxury-glass p-1.5 h-14 bg-muted/20 border-white/5">
                    <TabsTrigger value="calculator" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                        <Scale className="h-4 w-4" /> Évaluation Live
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-background">
                        <History className="h-4 w-4" /> Archives Cloud
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="calculator" className="space-y-10 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <ZakatCalculatorForm 
                                zakatData={zakatData} 
                                zakatInputs={zakatInputs} 
                                setZakatInputs={setZakatInputs} 
                                isInitialLoading={isLoading && zakatHistory.length === 0} 
                            />
                        </div>
                        <ZakatResultsPanel 
                            result={result} 
                            isSaving={isSaving} 
                            onSave={() => saveZakatCalculation(result)} 
                        />
                    </div>
                    <ZakatCharts result={result} zakatData={zakatData} />
                </TabsContent>

                <TabsContent value="history" className="space-y-8">
                    <ZakatHistoryTable 
                        history={zakatHistory} 
                        onViewDetails={(h) => { setSelectedHistory(h); setIsHistoryDialogOpen(true); }} 
                        onPrint={(h) => { setPrintData(h); }} 
                    />
                </TabsContent>
            </Tabs>

            <ZakatHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} calculation={selectedHistory} />
            <div className="hidden">{result && <ZakatReport ref={reportRef} calculation={printData || result} profile={profile} />}</div>
        </div>
    );
}
