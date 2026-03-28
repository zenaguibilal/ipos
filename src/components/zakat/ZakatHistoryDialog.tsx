'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, TrendingUp, Landmark, Banknote, Coins, CheckCircle2, ShieldCheck, Activity, Printer } from 'lucide-react';

interface ZakatHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    calculation: any;
    onPrint?: (calc: any) => void;
}

export function ZakatHistoryDialog({ isOpen, onOpenChange, calculation, onPrint }: ZakatHistoryDialogProps) {
    if (!calculation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl luxury-glass border-emerald-500/20 p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <DialogHeader className="p-10 bg-emerald-500/5 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <History className="h-32 w-32 rotate-12" />
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-4 bg-emerald-500/10 rounded-[1.5rem] shadow-inner">
                            <History className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tight italic">Point de Calcul <span className="text-emerald-500">Archivé</span></DialogTitle>
                            <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.3em] opacity-60 mt-3 flex items-center gap-2">
                                <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                                Enregistré le {format(new Date(calculation.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center relative overflow-hidden shadow-xl">
                            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] mb-3 relative z-10">Zakat Versée</p>
                            <p className="text-4xl font-black text-emerald-500 relative z-10">{formatCurrency(calculation.zakatAmount)}</p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-muted/20 border border-white/5 text-center shadow-inner">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-3">Assiette Nette</p>
                            <p className="text-4xl font-black tracking-tighter">{formatCurrency(calculation.zakatBase)}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4 ml-1">
                                <div className="h-1.5 w-8 bg-emerald-500 rounded-full" />
                                Breakdown des Actifs
                            </h4>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 font-black uppercase text-[8px] px-3">Valeurs Positives</Badge>
                        </div>
                        <div className="grid gap-4">
                            <DetailRow label="Valeur des Stocks" value={calculation.details?.inventoryValue} icon={TrendingUp} color="text-foreground" />
                            <DetailRow label="Créances Clients" value={calculation.details?.customerDebts} icon={TrendingUp} color="text-emerald-500" />
                            <DetailRow label="Cash & Liquidités" value={calculation.details?.cashOnHand} icon={Banknote} color="text-emerald-500" />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-destructive flex items-center gap-4 ml-1">
                                <div className="h-1.5 w-8 bg-destructive rounded-full" />
                                Breakdown des Passifs
                            </h4>
                            <Badge variant="outline" className="border-destructive/20 text-destructive font-black uppercase text-[8px] px-3">Déductions</Badge>
                        </div>
                        <div className="grid gap-4">
                            <DetailRow label="Dettes Fournisseurs" value={calculation.details?.supplierDebts} icon={Landmark} color="text-destructive" isNegative />
                            <DetailRow label="Autres Charges" value={calculation.details?.otherDebts} icon={Landmark} color="text-destructive" isNegative />
                        </div>
                    </div>

                    <div className="p-6 rounded-[1.5rem] bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Coins className="h-5 w-5 text-emerald-500" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Référence Or (24k)</span>
                        </div>
                        <span className="font-black text-lg text-emerald-500">{formatCurrency(calculation.details?.goldPrice || 0)} <span className="text-[10px] font-bold">/g</span></span>
                    </div>
                </div>

                <DialogFooter className="p-10 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed max-w-xs">
                            "Ce point de calcul constitue une archive immuable de l'état de votre patrimoine commercial à cette date."
                        </p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 px-8 font-black uppercase text-[11px] tracking-widest border border-white/10">Fermer</Button>
                        {onPrint && (
                            <Button onClick={() => onPrint(calculation)} className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-2xl shadow-primary/20 transition-all">
                                <Printer className="h-5 w-5" /> Imprimer
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({ label, value, icon: Icon, color, isNegative }: any) {
    if (value === undefined) return null;
    return (
        <div className="flex items-center justify-between p-5 rounded-2xl bg-background/40 border border-white/5 hover:border-white/10 transition-colors shadow-sm group">
            <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", color.replace('text-', 'bg-') + '/10')}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight opacity-80">{label}</span>
            </div>
            <span className={cn("font-black text-base tracking-tighter", color)}>
                {isNegative ? '-' : ''}{formatCurrency(value)}
            </span>
        </div>
    );
}
