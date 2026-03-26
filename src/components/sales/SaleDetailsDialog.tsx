
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
import { Printer, X, HandCoins } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
    onPrint?: () => void;
    onRecordPayment?: () => void;
}

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
    onPrint,
    onRecordPayment,
}: SaleDetailsDialogProps) {
    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl luxury-glass border-primary/20">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Détails de la vente
                                <span className="text-primary font-mono text-lg">#{sale.invoiceNumber}</span>
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                Client: <span className="font-semibold text-foreground">{customerName || 'Client de passage'}</span>
                                <br />
                                Date: {format(safeToDate(sale.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="max-h-[40vh] overflow-y-auto my-4 border rounded-xl bg-background/50">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="font-bold">Produit</TableHead>
                                <TableHead className="text-center font-bold">Qté</TableHead>
                                <TableHead className="text-right font-bold">Prix U.</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items?.map((item, index) => (
                                <TableRow key={index} className="border-b last:border-0">
                                    <TableCell className="font-medium py-3">{item.name}</TableCell>
                                    <TableCell className="text-center font-mono py-3">{item.quantity}</TableCell>
                                    <TableCell className="text-right py-3">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right font-bold py-3">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-muted/20 rounded-xl border border-border/50">
                        <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-3">
                            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Paiement</h4>
                            {onRecordPayment && (
                                <Button variant="ghost" size="sm" onClick={onRecordPayment} className="h-6 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                    <HandCoins className="h-3 w-3 mr-1" /> Encaisser solde
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {sale.payments.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm items-center">
                                    <span className="capitalize font-medium text-muted-foreground">{p.method === 'cash' ? '💵 Espèces' : p.method === 'card' ? '💳 Carte' : '❓ Autre'}</span>
                                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <Separator className="my-2 opacity-50" />
                        
                        <div className="space-y-1">
                            {sale.amountPaid > sale.total && (
                                <div className="flex justify-between text-sm text-chart-quaternary font-bold">
                                    <span>Monnaie rendue</span>
                                    <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
                                </div>
                            )}
                            {sale.remainingBalance > 0 && (
                                <div className="flex justify-between text-sm text-destructive font-black">
                                    <span>Reste à payer</span>
                                    <span>{formatCurrency(sale.remainingBalance)}</span>
                                </div>
                            )}
                            {sale.remainingBalance <= 0 && sale.amountPaid >= sale.total && (
                                <div className="flex justify-center pt-1">
                                    <span className="text-[10px] uppercase font-black text-chart-quaternary px-2 py-0.5 bg-chart-quaternary/10 rounded-full border border-chart-quaternary/20">Vente réglée</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest border-b border-primary/20 pb-2 mb-3">Récapitulatif</h4>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sous-total</span>
                                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {sale.discountAmount && sale.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-destructive">
                                    <span>Remise {sale.discountType === 'percentage' && `(${Math.round((sale.discountAmount / sale.subtotal) * 100)}%)`}</span>
                                    <span className="font-bold">- {formatCurrency(sale.discountAmount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between font-black text-2xl text-primary pt-3 border-t border-primary/20 mt-3">
                            <span>TOTAL</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/50 pt-4">
                    <div className="flex w-full flex-col sm:flex-row justify-between items-center gap-2">
                        <Button variant="outline" onClick={onPrint} className="w-full sm:w-auto gap-2 border-primary/30 hover:bg-primary/10">
                            <Printer className="h-4 w-4" />
                            Réimprimer le Reçu
                        </Button>
                        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Fermer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
