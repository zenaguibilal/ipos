
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ZakatResultsPanelProps {
    result: any;
    isSaving: boolean;
    onSave: () => void;
}

export function ZakatResultsPanel({ result, isSaving, onSave }: ZakatResultsPanelProps) {
    if (!result) return null;

    const nisabGap = result.nisab - result.zakatBase;

    return (
        <Card className={cn(
            "luxury-glass border-2 overflow-hidden transition-all duration-1000 shadow-2xl relative h-full",
            result.isNisabReached ? "border-emerald-500/40 bg-emerald-500/[0.03]" : "border-white/5 bg-muted/10 grayscale-[0.5]"
        )}>
            <CardHeader className="text-center bg-white/5 p-10 border-b border-white/5">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-6">Verdict Core iPOS</CardTitle>
                <p className={cn("text-5xl font-black tracking-tighter mb-2", result.isNisabReached ? "text-emerald-500" : "text-muted-foreground")}>
                    {formatCurrency(result.zakatBase)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Assiette Zakat Nette</p>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5">Nisab (85g Or)</p>
                        <p className="text-sm font-black">{formatCurrency(result.nisab)}</p>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                        <p className="text-[9px] font-black text-emerald-500 uppercase mb-1.5">Zakat Due (2.5%)</p>
                        <p className="text-xl font-black text-emerald-500">{formatCurrency(result.zakatAmount)}</p>
                    </div>
                </div>
                
                {!result.isNisabReached && nisabGap > 0 && (
                    <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 text-center">
                        <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1">فجوة النصاب</p>
                        <p className="text-lg font-black text-destructive">-{formatCurrency(nisabGap)}</p>
                    </div>
                )}

                <div className={cn(
                    "p-6 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all shadow-xl",
                    result.isNisabReached ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-muted/30 border-white/10 text-muted-foreground"
                )}>
                    {result.isNisabReached ? <CheckCircle2 className="h-8 w-8 shrink-0" /> : <AlertCircle className="h-8 w-8 shrink-0" />}
                    <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-widest">{result.isNisabReached ? 'Nisab Atteint' : 'Patrimoine Inférieur'}</p>
                        <p className="text-[10px] italic leading-tight font-medium">
                            {result.isNisabReached ? "La فريضة est applicable." : "Seuil de وجوب non atteint."}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-10 bg-white/5 border-t border-white/5">
                <Button onClick={onSave} disabled={isSaving || !result.isNisabReached} className="w-full h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] gap-4 shadow-2xl shadow-emerald-500/30 group hover:scale-105 active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isSaving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>} 
                    Archiver le Point de Calcul
                </Button>
            </CardFooter>
        </Card>
    );
}
