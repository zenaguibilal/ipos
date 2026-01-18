'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductReturn } from '@/lib/types';
import { Button } from '../ui/button';
import { safeToDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReturnDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    productReturn: ProductReturn;
}

export function ReturnDetailsDialog({ isOpen, onOpenChange, productReturn }: ReturnDetailsDialogProps) {
    if (!productReturn) return null;

    const returnDate = safeToDate(productReturn.createdAt);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Détails du Retour</DialogTitle>
                    <DialogDescription>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-2 gap-2">
                             <p><strong>N° Facture Originale:</strong> <span className="font-mono">{productReturn.originalInvoiceNumber}</span></p>
                             <p><strong>Date du retour:</strong> {format(returnDate, 'd MMMM yyyy, HH:mm', { locale: fr })}</p>
                        </div>
                         <p><strong>Client:</strong> {productReturn.customerName || 'N/A'}</p>
                    </DialogDescription>
                </DialogHeader>
                
                {productReturn.notes && (
                    <div className="my-4 p-3 bg-muted/50 border rounded-md">
                        <p className="text-sm"><strong className="font-medium">Notes:</strong> {productReturn.notes}</p>
                    </div>
                )}
                
                <div className="max-h-[40vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit Retourné</TableHead>
                                <TableHead className="text-center">Quantité</TableHead>
                                <TableHead className="text-right">Prix (à la vente)</TableHead>
                                <TableHead className="text-right">Sous-total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productReturn.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.price.toFixed(2)} DA</TableCell>
                                    <TableCell className="text-right">{(item.quantity * item.price).toFixed(2)} DA</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                 <div className="flex flex-col items-end gap-2 pt-4">
                    <div className="flex justify-between w-full max-w-xs text-sm">
                        <span className="text-muted-foreground">Valeur Totale du Retour:</span>
                        <span className="font-semibold">{productReturn.totalReturnValue.toFixed(2)} DA</span>
                    </div>
                     <div className="flex justify-between w-full max-w-xs text-sm text-destructive">
                        <span className="font-semibold">Montant Remboursé:</span>
                        <span className="font-bold">-{productReturn.amountRefunded.toFixed(2)} DA</span>
                    </div>
                 </div>

                <DialogFooter className="mt-4">
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
