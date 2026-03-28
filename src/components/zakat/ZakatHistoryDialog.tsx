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
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, TrendingUp, Landmark, Banknote, Coins, CheckCircle2 } from 'lucide-react';

interface ZakatHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    calculation: any;
}

export function ZakatHistoryDialog({ isOpen, onOpenChange, calculation }: ZakatHistoryDialogProps) {
    if (!calculation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl luxury-glass border-primary/20 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                            <History className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">Point de Calcul <span className="text-primary">Archivé</span></DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">
                                Enregistré le {format(new Date(calculation.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                            <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-2">Zakat Versée</p>
                            <p className="text-3xl font-black text-primary">{formatCurrency(calculation.zakatAmount)}</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Assiette Nette</p>
                            <p className="text-3xl font-black">{formatCurrency(calculation.zakatBase)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 ml-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Breakdown des Actifs ( Snapshot )
                        </h4>
                        <div className="grid gap-3">
                            <DetailRow label="Valeur des Stocks" value={calculation.details.inventoryValue} icon={TrendingUp} color="text-foreground" />
                            <DetailRow label="Créances Clients" value={calculation.details.customerDebts} icon={TrendingUp} color="text-chart-quaternary" />
                            <DetailRow label="Cash & Liquidités" value={calculation.details.cashOnHand} icon={Banknote} color="text-primary" />
                        </div>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-destructive flex items-center gap-3 ml-1">
                            <Landmark className="h-4 w-4" />
                            Breakdown des Passifs
                        </h4>
                        <div className="grid gap-3">
                            <DetailRow label="Dettes Fournisseurs" value={calculation.details.supplierDebts} icon={Landmark} color="text-destructive" isNegative />
                            <DetailRow label="Autres Charges" value={calculation.details.otherDebts} icon={Landmark} color="text-destructive" isNegative />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Coins className="h-4 w-4 text-primary opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Référence Or (24k)</span>
                        </div>
                        <span className="font-bold text-sm">{formatCurrency(calculation.details.goldPrice)} /g</span>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-white/5 border-t border-white/5">
                    <Button onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest w-full">
                        Fermer l'Archive
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({ label, value, icon: Icon, color, isNegative }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-white/5", color.replace('text-', 'bg-') + '/10')}>
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
                <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
            </div>
            <span className={cn("font-black text-sm", color)}>
                {isNegative ? '-' : ''}{formatCurrency(value)}
            </span>
        </div>
    );
}

import { cn } from '@/lib/utils';
