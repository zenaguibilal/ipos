
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
import { Printer } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
    onPrint,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
    onPrint?: () => void;
}) {
    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Détails de la vente
                        <span className="text-primary font-mono text-base ml-2">#{sale.invoiceNumber}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Client: <span className="font-semibold text-foreground">{customerName || 'Client de passage'}</span>
                        <br />
                        Date: {format(safeToDate(sale.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[50vh] overflow-y-auto my-4 border rounded-lg">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Qté</TableHead>
                                <TableHead className="text-right">Prix Unitaire</TableHead>
                                <TableHead className="text-right font-bold">Sous-total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items?.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground border-b pb-1 mb-2">Informations Paiement</h4>
                        {sale.payments.map((p, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="capitalize">{p.method === 'cash' ? 'Espèces' : p.method === 'card' ? 'Carte' : 'Autre'}</span>
                                <span className="font-semibold">{formatCurrency(p.amount)}</span>
                            </div>
                        ))}
                        {sale.amountPaid > sale.total && (
                            <div className="flex justify-between text-sm text-green-600 font-bold border-t pt-1 mt-1">
                                <span>Monnaie rendue</span>
                                <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
                            </div>
                        )}
                        {sale.remainingBalance > 0 && (
                            <div className="flex justify-between text-sm text-destructive font-bold border-t pt-1 mt-1">
                                <span>Reste à payer</span>
                                <span>{formatCurrency(sale.remainingBalance)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground border-b pb-1 mb-2">Récapitulatif</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span>{formatCurrency(sale.subtotal)}</span>
                        </div>
                        {sale.discountAmount && sale.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span>Remise {sale.discountType === 'percentage' && `(${Math.round((sale.discountAmount / sale.subtotal) * 100)}%)`}</span>
                                <span>- {formatCurrency(sale.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-xl text-primary pt-2 border-t border-primary/20">
                            <span>TOTAL</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <div className="flex w-full justify-between items-center">
                        <Button variant="outline" onClick={onPrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Réimprimer Reçu
                        </Button>
                        <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
