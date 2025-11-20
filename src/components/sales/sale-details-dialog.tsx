
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Sale } from '@/app/(app)/sales-history/page';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';


function StatusBadge({ status }: { status: Sale['paymentStatus'] }) {
    return (
        <span className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold',
            status === 'paid' && 'bg-green-500/20 text-green-400',
            status === 'partial' && 'bg-yellow-500/20 text-yellow-400',
            status === 'unpaid' && 'bg-red-500/20 text-red-400',
        )}>
            {status === 'paid' && 'Payé'}
            {status === 'partial' && 'Partiel'}
            {status === 'unpaid' && 'Impayé'}
        </span>
    );
}

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    sale: Sale;
}

export function SaleDetailsDialog({ isOpen, onOpenChange, sale }: SaleDetailsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Détails de la Facture</DialogTitle>
                    <DialogDescription>
                        Récapitulatif de la vente <span className="font-mono">{sale.invoiceNumber}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Client:</span>
                        <span className="font-medium">{sale.customerName || 'Vente au comptoir'}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{format(sale.createdAt.toDate(), 'd LLL yyyy, HH:mm', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Statut:</span>
                        <StatusBadge status={sale.paymentStatus} />
                    </div>

                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Articles</h4>
                        <div className="border rounded-md">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Produit</th>
                                        <th scope="col" className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Qté</th>
                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Prix Unitaire</th>
                                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sale.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-muted-foreground">{item.quantity}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.price.toFixed(2)} DA</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">{(item.price * item.quantity).toFixed(2)} DA</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 border-t pt-4">
                         <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>{sale.total.toFixed(2)} DA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Montant Payé</span>
                            <span className="text-green-400">{sale.amountPaid.toFixed(2)} DA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Solde Restant</span>
                             <span className={cn(sale.remainingBalance > 0 && "text-destructive font-bold")}>
                                {sale.remainingBalance.toFixed(2)} DA
                            </span>
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
