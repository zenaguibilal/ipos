
'use client';

import type { PurchaseOrder, PurchaseOrderStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Trash2, Send, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoryTableProps {
    purchaseOrders: PurchaseOrder[];
    onViewOrder: (order: PurchaseOrder) => void;
    onChangeStatus: (order: PurchaseOrder, status: 'send' | 'receive') => void;
    onDeleteOrder: (order: PurchaseOrder) => void;
}

export function HistoryTable({ purchaseOrders, onViewOrder, onChangeStatus, onDeleteOrder }: HistoryTableProps) {
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
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseOrders.map((order) => (
                        <TableRow key={order.id}>
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
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Ouvrir le menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onViewOrder(order)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            <span>Visualiser</span>
                                        </DropdownMenuItem>
                                        {order.status === 'draft' && (
                                            <DropdownMenuItem onClick={() => onChangeStatus(order, 'send')}>
                                                <Send className="mr-2 h-4 w-4" />
                                                <span>Marquer comme envoyé</span>
                                            </DropdownMenuItem>
                                        )}
                                        {order.status === 'sent' && (
                                            <DropdownMenuItem onClick={() => onChangeStatus(order, 'receive')}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span>Marquer comme reçu</span>
                                            </DropdownMenuItem>
                                        )}
                                         {order.status === 'draft' && (
                                            <DropdownMenuItem onClick={() => onDeleteOrder(order)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Supprimer</span>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
