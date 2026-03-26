
'use client';

import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Truck, Clock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsProps {
    orders?: BreadOrder[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { ordered: 0, delivered: 0, remaining: 0 };
        const ordered = orders.reduce((sum, o) => sum + o.quantite, 0);
        const delivered = orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0);
        return {
            ordered,
            delivered,
            remaining: ordered - delivered,
        };
    }, [orders]);

    if(isLoading && !orders) {
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
            <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Commandé</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.ordered} <span className="text-sm font-normal text-muted-foreground">pains</span></div>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-chart-quaternary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Déjà Livré</CardTitle>
                    <Truck className="h-4 w-4 text-chart-quaternary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-chart-quaternary">{stats.delivered}</div>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-chart-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Reste à Livrer</CardTitle>
                    <Clock className="h-4 w-4 text-chart-secondary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-chart-secondary">{stats.remaining}</div>
                </CardContent>
            </Card>
        </div>
    );
}
