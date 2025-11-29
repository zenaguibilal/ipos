
'use client';

import type { PurchaseOrder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoryTableProps {
    purchaseOrders: PurchaseOrder[];
    onViewOrder: (order: PurchaseOrder) => void;
}

export function HistoryTable({ purchaseOrders, onViewOrder }: HistoryTableProps) {
    if (purchaseOrders.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                <p className="text-muted-foreground">Aucun bon de commande trouvé.</p>
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Valeur Totale</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseOrders.map((order) => (
                        <TableRow key={order.id} onClick={() => onViewOrder(order)} className="cursor-pointer">
                            <TableCell className="font-mono">{order.poNumber}</TableCell>
                            <TableCell className="font-medium">
                                {format(order.createdAt.toDate(), 'd LLL yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell>{order.supplierName}</TableCell>
                            <TableCell>
                                <Badge 
                                    variant={
                                        order.status === 'received' ? 'default' : 
                                        order.status === 'sent' ? 'secondary' : 'outline'
                                    }
                                    className={
                                        order.status === 'received' ? 'bg-green-600 hover:bg-green-600/90' : ''
                                    }
                                >
                                    {order.status === 'draft' && 'Brouillon'}
                                    {order.status === 'sent' && 'Envoyé'}
                                    {order.status === 'received' && 'Reçu'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{order.totalValue.toFixed(2)} DA</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
