'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
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
import type { StockIntake, Supplier } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function StockIntakeDetailsDialog({
    isOpen,
    onOpenChange,
    intake,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    intake: StockIntake | null;
}) {
    const supplier = useLiveQuery(() => 
        intake?.supplierId ? db.suppliers.get(intake.supplierId) : undefined,
        [intake]
    );

    if (!intake) return null;
    
    const supplierName = intake.supplierName || supplier?.name || 'Fournisseur inconnu';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Détails de la réception</DialogTitle>
                    <DialogDescription>
                        Fournisseur: <span className="font-semibold">{supplierName}</span> | Facture n°:{' '}
                        <span className="font-mono">{intake.invoiceNumber}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Quantité Reçue</TableHead>
                                <TableHead className="text-right">Prix d'achat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {intake.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-center">
                                        {item.quantityReceived}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(item.purchasePrice)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
