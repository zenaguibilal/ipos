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

export function ReturnDetailsDialog({
    isOpen,
    onOpenChange,
    productReturn,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productReturn: ProductReturn | null;
}) {
    if (!productReturn) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Détails du retour</DialogTitle>
                    <DialogDescription>
                        Basé sur la facture n°: <span className="font-mono font-semibold">{productReturn.originalInvoiceNumber}</span>
                        <br />
                        Date du retour: {format(safeToDate(productReturn.createdAt), 'd MMMM yyyy HH:mm', { locale: fr })}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto my-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Qté Retournée</TableHead>
                                <TableHead className="text-right">Prix Unitaire</TableHead>
                                <TableHead className="text-right">Sous-total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productReturn.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {productReturn.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-semibold">Notes:</p>
                            <p className="text-sm text-muted-foreground">{productReturn.notes}</p>
                        </div>
                    )}
                </div>
                 <div className="space-y-2 rounded-lg bg-muted p-4">
                    <div className="flex justify-between font-semibold text-lg"><span className="">Valeur totale du retour</span><span className="text-destructive">{formatCurrency(productReturn.totalReturnValue)}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t"><span className="text-muted-foreground">Montant Remboursé</span><span>{formatCurrency(productReturn.amountRefunded)}</span></div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
