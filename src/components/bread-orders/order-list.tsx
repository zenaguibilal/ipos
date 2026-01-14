
'use client';

import type { BreadOrder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { OrderCard } from './order-card';

interface OrderListProps {
    orders: BreadOrder[];
    onUpdateToggles: (id: string, field: 'isPaid' | 'isDelivered', value: boolean) => void;
    onEdit: (order: BreadOrder) => void;
    onDelete: (id: string) => void;
}

export function OrderList({ orders, onUpdateToggles, onEdit, onDelete }: OrderListProps) {
    if (orders.length === 0) {
        return (
            <Card className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-transparent shadow-none">
                <p className="text-muted-foreground">Aucune commande pour aujourd'hui.</p>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {orders.map(order => (
                <OrderCard 
                    key={order.id}
                    order={order}
                    onUpdateToggles={onUpdateToggles}
                    onEdit={() => onEdit(order)}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
