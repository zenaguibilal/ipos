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
import type { Sale } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
}) {
    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Détails de la vente</DialogTitle>
                    <DialogDescription>
                        Facture n°: <span className="font-mono font-semibold">{sale.invoiceNumber}</span> | Client: {customerName || 'Client de passage'}
                        <br />
                        Date: {format(safeToDate(sale.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto my-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Qté</TableHead>
                                <TableHead className="text-right">Prix Unitaire</TableHead>
                                <TableHead className="text-right">Sous-total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="space-y-2 rounded-lg bg-muted p-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span>{formatCurrency(sale.subtotal)}</span></div>
                    {sale.discountAmount && sale.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                            <span className="text-muted-foreground">
                                Remise
                                {sale.discountType === 'percentage' && sale.subtotal > 0 && ` (${Math.round((sale.discountAmount / sale.subtotal) * 100)}%)`}
                            </span>
                            <span>- {formatCurrency(sale.discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg"><span className="">Total</span><span>{formatCurrency(sale.total)}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t"><span className="text-muted-foreground">Montant Payé</span><span>{formatCurrency(sale.amountPaid)}</span></div>
                    <div className="flex justify-between text-sm font-semibold">
                        <span className={sale.remainingBalance > 0 ? 'text-destructive' : 'text-green-600'}>
                            {sale.remainingBalance > 0 ? 'Solde Restant' : 'Monnaie Rendue'}
                        </span>
                        <span className={sale.remainingBalance > 0 ? 'text-destructive' : 'text-green-600'}>
                            {formatCurrency(Math.abs(sale.remainingBalance))}
                        </span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
