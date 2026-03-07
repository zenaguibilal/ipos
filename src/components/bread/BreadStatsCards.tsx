'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyBreadOrder } from '@/lib/types';
import { Box, Truck, PackageCheck } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsCardsProps {
    orders?: DailyBreadOrder[];
}

export function BreadStatsCards({ orders }: BreadStatsCardsProps) {
    const stats = useMemo(() => {
        if (!orders) return { total: 0, delivered: 0, remaining: 0 };
        const total = orders.reduce((sum, o) => sum + o.quantity, 0);
        const delivered = orders
            .filter(o => o.status === 'livre' || o.status === 'paye')
            .reduce((sum, o) => sum + o.quantity, 0);
        return { total, delivered, remaining: total - delivered };
    }, [orders]);

    if (!orders) {
        return (
             <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                    <Box className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Livré</CardTitle>
                    <PackageCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.delivered}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reste à Livrer</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">{stats.remaining}</div></CardContent>
            </Card>
        </div>
    );
}
