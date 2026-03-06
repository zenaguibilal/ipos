
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle, Hourglass } from 'lucide-react';
import type { BreadOrder } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsCardsProps {
  orders: BreadOrder[] | undefined;
  isLoading: boolean;
}

export default function BreadStatsCards({ orders, isLoading }: BreadStatsCardsProps) {
    const stats = useMemo(() => {
        if (!orders) return { totalOrdered: 0, totalDelivered: 0, totalRemaining: 0 };
        let totalOrdered = 0;
        let totalDelivered = 0;

        for (const order of orders) {
            const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
            totalOrdered += quantity;
            
            if (order.todaysOrder?.isDelivered) {
                totalDelivered += quantity;
            }
        }
        
        return {
            totalOrdered,
            totalDelivered,
            totalRemaining: totalOrdered - totalDelivered,
        };
    }, [orders]);

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrdered}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quantité Livrée</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDelivered}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quantité Restante</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRemaining}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
