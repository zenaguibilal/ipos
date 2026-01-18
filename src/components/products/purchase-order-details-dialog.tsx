
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PurchaseOrder } from '@/lib/types';
import { Button } from '../ui/button';
import { safeToDate } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface PurchaseOrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    purchaseOrder: PurchaseOrder;
}

export function PurchaseOrderDetailsDialog({ isOpen, onOpenChange, purchaseOrder }: PurchaseOrderDetailsDialogProps) {
    if (!purchaseOrder) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Détails du Bon de Commande</DialogTitle>
                    <DialogDescription>
                        <div className="flex justify-between items-center mt-2">
                             <p><strong>N°:</strong> <span className="font-mono">{purchaseOrder.poNumber}</span></p>
                             <p><strong>Date:</strong> {safeToDate(purchaseOrder.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                         <p><strong>Fournisseur:</strong> {purchaseOrder.supplier}</p>
                         <p>
                           <strong>Statut:</strong>
                           <Badge variant={purchaseOrder.status === 'pending' ? 'secondary' : 'default'} className="ml-2">
                            {purchaseOrder.status === 'pending' ? 'En attente' : 'Réceptionné'}
                           </Badge>
                         </p>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Quantité</TableHead>
                                <TableHead className="text-right">Prix d'Achat</TableHead>
                                <TableHead className="text-right">Sous-total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseOrder.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{item.purchasePrice.toFixed(1)} DA</TableCell>
                                    <TableCell className="text-right">{(item.quantity * item.purchasePrice).toFixed(1)} DA</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                 <div className="flex justify-end pt-4 font-bold text-lg">
                    <span>Total: {purchaseOrder.totalValue.toFixed(1)} DA</span>
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
