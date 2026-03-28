
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
import type { ProductReturn } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { PackageCheck, PackageX, Printer, Undo2, Hash, Calendar, FileText, Banknote, HandCoins } from 'lucide-react';
import { Separator } from '../ui/separator';
import React, { useRef } from 'react';
import { ReturnReceipt } from './ReturnReceipt';
import { useAppStore } from '@/stores/appStore';

/**
 * @fileOverview Return Details Dialog (Sovereign Authority Style)
 */

interface ReturnDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productReturn: ProductReturn | null;
}

export function ReturnDetailsDialog({
    isOpen,
    onOpenChange,
    productReturn,
}: ReturnDetailsDialogProps) {
    const profile = useAppStore(state => state.profile);
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!productReturn) return null;

    const impactDebt = Math.max(0, productReturn.totalReturnValue - productReturn.amountRefunded);

    const handlePrint = (formatType: 'thermal' | 'a4') => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = receiptRef.current;

        if (!printableContent || !receiptElement) return;

        const receiptClone = receiptElement.cloneNode(true) as HTMLDivElement;
        
        document.documentElement.classList.toggle('thermal', formatType === 'thermal');
        receiptClone.classList.add(formatType === 'thermal' ? 'thermal-receipt' : 'a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(receiptClone);

        setTimeout(() => {
            window.print();
            document.documentElement.classList.remove('thermal');
        }, 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl luxury-glass border-destructive/20 p-0 overflow-hidden shadow-2xl print-dialog-content">
                <DialogHeader className="p-8 bg-destructive/[0.03] border-b border-white/5 print-hide">
                    <div className="flex justify-between items-start gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-destructive/10 rounded-xl">
                                    <Undo2 className="h-6 w-6 text-destructive" />
                                </div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Archives du Retour</DialogTitle>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-mono font-bold">
                                    <Hash className="h-3 w-3 text-destructive" />
                                    Ref: {productReturn.originalInvoiceNumber}
                                </Badge>
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-bold">
                                    <Calendar className="h-3 w-3 text-destructive" />
                                    {format(safeToDate(productReturn.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-destructive opacity-60 mb-1">Impact Financier Total</p>
                            <p className="text-4xl font-black tracking-tighter text-destructive">-{formatCurrency(productReturn.totalReturnValue)}</p>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-8 space-y-8 print-hide">
                    <div className="max-h-[35vh] overflow-y-auto border rounded-[2rem] bg-background/40 shadow-inner">
                        <Table>
                            <TableHeader className="bg-white/5 sticky top-0 z-10">
                                <TableRow className="border-white/5">
                                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 pl-6">Produit Restitué</TableHead>
                                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Qté</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Prix U.</TableHead>
                                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Action Stock</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-6">Sous-Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productReturn.items?.map((item, index) => (
                                    <TableRow key={index} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-bold py-4 pl-6">{item.productName}</TableCell>
                                        <TableCell className="text-center font-mono font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-center">
                                            {item.wasRestocked ? (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black gap-1.5 h-5 px-2">
                                                    <PackageCheck className="h-2.5 w-2.5" /> RE-STOCK
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-black gap-1.5 h-5 px-2">
                                                    <PackageX className="h-2.5 w-2.5" /> PERTE
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold pr-6">{formatCurrency(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-4 p-6 rounded-[2rem] bg-muted/20 border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-4">
                                <Banknote className="h-4 w-4 text-chart-quaternary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Régularisation Flux</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Remboursé Cash</span>
                                    <span className="font-black text-chart-quaternary">{formatCurrency(productReturn.amountRefunded)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Crédité sur Compte</span>
                                    <span className="font-black text-primary">{formatCurrency(impactDebt)}</span>
                                </div>
                            </div>
                        </div>

                        {productReturn.notes && (
                            <div className="p-6 rounded-[2rem] bg-background/40 border border-white/5 space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground opacity-60">
                                    <FileText className="h-3 w-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Motif du retour</span>
                                </div>
                                <p className="text-xs italic leading-relaxed">"{productReturn.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden">
                    <ReturnReceipt ref={receiptRef} productReturn={productReturn} profile={profile} />
                </div>

                <DialogFooter className="p-8 bg-white/5 border-t border-white/5 print-hide">
                    <div className="flex w-full flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => handlePrint('thermal')} className="flex-1 rounded-xl h-12 px-6 gap-2 border-primary/30 font-black uppercase text-[10px] tracking-widest">
                                <Printer className="h-4 w-4" /> 80mm
                            </Button>
                            <Button variant="outline" onClick={() => handlePrint('a4')} className="flex-1 rounded-xl h-12 px-6 gap-2 border-primary/30 font-black uppercase text-[10px] tracking-widest">
                                <Printer className="h-4 w-4" /> A4 PDF
                            </Button>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest">
                            Fermer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
