
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
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';

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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Détails de la réception de stock</DialogTitle>
                    <DialogDescription>
                        Fournisseur: <span className="font-semibold">{supplierName || 'Fournisseur inconnu'}</span> | Facture n°:{' '}
                        <span className="font-mono">{intake.invoiceNumber}</span>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[50vh] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Qté Reçue</TableHead>
                                <TableHead className="text-right">Prix Achat U.</TableHead>
                                <TableHead className="text-right bg-primary/5 text-primary">Revient U.</TableHead>
                                <TableHead className="text-right">Total March.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {intake.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-center">
                                        {item.quantityReceived}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.purchasePrice)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-primary bg-primary/5">
                                        {item.costPrice ? formatCurrency(item.costPrice) : formatCurrency(item.purchasePrice)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.quantityReceived * item.purchasePrice)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-4 flex flex-col items-end space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between w-48 text-sm">
                        <span>Marchandise :</span>
                        <span className="font-medium">{formatCurrency(intake.totalValue)}</span>
                    </div>
                    <div className="flex justify-between w-48 text-sm text-primary">
                        <span>Transport :</span>
                        <span className="font-medium">{formatCurrency(intake.transportFees || 0)}</span>
                    </div>
                    <Separator className="w-48" />
                    <div className="flex justify-between w-48 font-bold text-lg">
                        <span>TOTAL :</span>
                        <span>{formatCurrency(intake.totalValue + (intake.transportFees || 0))}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
