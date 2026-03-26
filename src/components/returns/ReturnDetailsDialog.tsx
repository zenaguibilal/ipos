
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
import { PackageCheck, PackageX, Printer } from 'lucide-react';
import { Separator } from '../ui/separator';
import React, { useRef } from 'react';
import { ReturnReceipt } from './ReturnReceipt';
import { useAppStore } from '@/stores/appStore';

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

    const impactDebt = productReturn.totalReturnValue - productReturn.amountRefunded;

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
            <DialogContent className="max-w-2xl luxury-glass border-destructive/20 print-dialog-content">
                <DialogHeader className="print-hide">
                    <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                        Détails du retour
                        <span className="text-muted-foreground font-mono text-base">#{productReturn.originalInvoiceNumber}</span>
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                        Opération effectuée le : <span className="font-semibold text-foreground">{format(safeToDate(productReturn.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[45vh] overflow-y-auto my-4 border rounded-2xl bg-background/50 print-hide">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="font-bold">Produit</TableHead>
                                <TableHead className="text-center font-bold">Qté</TableHead>
                                <TableHead className="text-right font-bold">Prix Unitaire</TableHead>
                                <TableHead className="text-center font-bold">État Stock</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productReturn.items?.map((item, index) => (
                                <TableRow key={index} className="border-b last:border-0">
                                    <TableCell className="font-medium py-3">{item.productName}</TableCell>
                                    <TableCell className="text-center font-mono py-3">{item.quantity}</TableCell>
                                    <TableCell className="text-right py-3">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-center py-3">
                                        {item.wasRestocked ? (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] gap-1">
                                                <PackageCheck className="h-3 w-3" /> Réintégré
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                                                <PackageX className="h-3 w-3" /> Perdu
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold py-3">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-hide">
                    <div className="space-y-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest border-b border-border/50 pb-2 mb-3">Régularisation Financière</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm items-center">
                                <span className="font-medium text-muted-foreground">💵 Remboursé Espèces</span>
                                <span className="font-bold text-chart-quaternary">{formatCurrency(productReturn.amountRefunded)}</span>
                            </div>
                            {impactDebt > 0.01 && (
                                <div className="flex justify-between text-sm items-center">
                                    <span className="font-medium text-muted-foreground">💳 Crédit sur solde</span>
                                    <span className="font-bold text-primary">{formatCurrency(impactDebt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 p-4 bg-destructive/5 rounded-2xl border border-destructive/20">
                        <h4 className="text-xs font-black uppercase text-destructive tracking-widest border-b border-destructive/20 pb-2 mb-3">Impact Financier</h4>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Valeur marchandises</span>
                                <span className="font-medium">{formatCurrency(productReturn.totalReturnValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black text-destructive pt-3 border-t border-destructive/20 mt-3">
                                <span>TOTAL</span>
                                <span>-{formatCurrency(productReturn.totalReturnValue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {productReturn.notes && (
                    <div className="p-3 bg-muted/30 rounded-xl border border-border/50 text-sm print-hide">
                        <span className="font-bold text-xs uppercase text-muted-foreground block mb-1">Raison du retour :</span>
                        <p className="italic">"{productReturn.notes}"</p>
                    </div>
                )}

                {/* Hidden printable receipt */}
                <div className="hidden">
                    <ReturnReceipt ref={receiptRef} productReturn={productReturn} profile={profile} />
                </div>

                <DialogFooter className="mt-4 gap-2 sm:gap-0 print-hide">
                    <div className="flex w-full flex-col sm:flex-row justify-between gap-2">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handlePrint('thermal')} className="gap-2 border-primary/30">
                                <Printer className="h-4 w-4" /> Ticket (80mm)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handlePrint('a4')} className="gap-2 border-primary/30">
                                <Printer className="h-4 w-4" /> Facture A4
                            </Button>
                        </div>
                        <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
