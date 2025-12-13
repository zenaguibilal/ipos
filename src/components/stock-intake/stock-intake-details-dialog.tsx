
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { StockIntake } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { safeToDate } from '@/lib/utils';

interface StockIntakeDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    stockIntake: StockIntake;
}

export function StockIntakeDetailsDialog({ isOpen, onOpenChange, stockIntake }: StockIntakeDetailsDialogProps) {
    if (!stockIntake) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Détails de la réception</DialogTitle>
                    <DialogDescription>
                        Récapitulatif de la réception de stock pour la facture <span className="font-mono">{stockIntake.invoiceNumber}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date de réception :</span>
                        <span className="font-medium">{format(safeToDate(stockIntake.createdAt), 'd LLL yyyy, HH:mm', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date de facture :</span>
                        <span className="font-medium">{format(safeToDate(stockIntake.invoiceDate), 'd LLL yyyy', { locale: fr })}</span>
                    </div>

                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Articles reçus</h4>
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead className="text-center">Quantité</TableHead>
                                        <TableHead className="text-right">Prix d'achat unitaire</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockIntake.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell className="text-center">{item.quantityReceived}</TableCell>
                                            <TableCell className="text-right">{item.purchasePrice.toFixed(2)} DA</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 border-t pt-4">
                         <div className="flex justify-between font-semibold text-lg">
                            <span>Valeur totale de la réception</span>
                            <span>{stockIntake.totalValue.toFixed(2)} DA</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
