
'use client';

import type { BreadOrder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Repeat } from 'lucide-react';

interface OrderListProps {
    orders: BreadOrder[];
    onUpdate: (id: string, field: keyof BreadOrder, value: boolean) => void;
    onDelete: (id: string) => void;
}

export function OrderList({ orders, onUpdate, onDelete }: OrderListProps) {
    if (orders.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                <p className="text-muted-foreground">Aucune commande pour aujourd'hui.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Nom</TableHead>
                        <TableHead className="text-center">Quantité</TableHead>
                        <TableHead className="text-center">Payé</TableHead>
                        <TableHead className="text-center">Livré</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {order.name}
                                {order.isRecurring && <Repeat className="h-4 w-4 text-muted-foreground" title="Commande récurrente"/>}
                            </TableCell>
                            <TableCell className="text-center font-bold text-lg">{order.quantity}</TableCell>
                            <TableCell className="text-center">
                                <Checkbox
                                    checked={order.isPaid}
                                    onCheckedChange={(checked) => onUpdate(order.id, 'isPaid', !!checked)}
                                />
                            </TableCell>
                            <TableCell className="text-center">
                                 <Checkbox
                                    checked={order.isDelivered}
                                    onCheckedChange={(checked) => onUpdate(order.id, 'isDelivered', !!checked)}
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

    