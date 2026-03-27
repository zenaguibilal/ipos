'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { StockIntake } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Archive, Hash, User, Calendar, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '../ui/badge';

/**
 * @fileOverview Stock Intake Details (Sovereign Engineering)
 */

export function StockIntakeDetailsDialog({
    isOpen,
    onOpenChange,
    intake,
    supplierName,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    intake: StockIntake | null;
    supplierName?: string;
}) {
    if (!intake) return null;

    const totalWithTransport = intake.totalValue + (intake.transportFees || 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl luxury-glass border-white/10 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex justify-between items-start gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Archive className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Analyse de Réception</DialogTitle>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-bold">
                                    <User className="h-3 w-3 text-primary" />
                                    {supplierName || 'Fournisseur inconnu'}
                                </Badge>
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-mono font-bold">
                                    <Hash className="h-3 w-3 text-primary" />
                                    {intake.invoiceNumber}
                                </Badge>
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-bold">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    {format(safeToDate(intake.invoiceDate), 'd MMMM yyyy', { locale: fr })}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 mb-1">Valeur Totale Apportée</p>
                            <p className="text-4xl font-black tracking-tighter text-primary">{formatCurrency(totalWithTransport)}</p>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-8 space-y-8">
                    <div className="max-h-[40vh] overflow-y-auto border rounded-[2rem] bg-background/40 shadow-inner">
                        <Table>
                            <TableHeader className="bg-white/5 sticky top-0 z-10">
                                <TableRow className="border-white/5">
                                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Produit Référencé</TableHead>
                                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Quantité</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Achat U.</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px] bg-primary/5 text-primary">Revient U.</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Total March.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {intake.items.map((item, index) => (
                                    <TableRow key={index} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-bold py-4">
                                            <div className="flex flex-col">
                                                {item.productName}
                                                {item.quantityDamaged > 0 && (
                                                    <span className="text-[10px] text-destructive flex items-center gap-1 mt-0.5">
                                                        <AlertCircle className="h-2.5 w-2.5" />
                                                        {item.quantityDamaged} unités endommagées déduites
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-bold">
                                            {item.quantityReceived - item.quantityDamaged}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(item.purchasePrice)}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-primary bg-primary/5">
                                            {formatCurrency(item.costPrice || item.purchasePrice)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold opacity-70">
                                            {formatCurrency((item.quantityReceived - item.quantityDamaged) * item.purchasePrice)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Truck className="h-5 w-5 text-orange-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Impact Logistique</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                "Les frais de transport ont été répartis proportionnellement sur chaque article pour déterminer le coût de revient réel, impactant ainsi votre marge finale."
                            </p>
                        </div>

                        <div className="space-y-3 p-6 rounded-[2.5rem] bg-muted/20 border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Marchandise Nette</span>
                                <span className="font-bold">{formatCurrency(intake.totalValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-orange-400">
                                <span className="font-black uppercase tracking-widest text-[10px]">Frais de Port (Fret)</span>
                                <span className="font-black">+ {formatCurrency(intake.transportFees || 0)}</span>
                            </div>
                            <Separator className="bg-white/10 my-2" />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[11px] font-black uppercase text-primary tracking-[0.2em]">Investissement Total</span>
                                <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(totalWithTransport)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-white/5 border-t border-white/5">
                    <Button onClick={() => onOpenChange(false)} className="rounded-2xl px-12 h-14 font-black uppercase text-[11px] tracking-widest bg-muted/20 hover:bg-muted/30 border border-white/5 text-foreground">
                        Fermer le Registre
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
