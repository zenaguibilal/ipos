'use client';

import { useMemo } from 'react';
import type { BreadOrderWithClient } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Truck, CheckCircle } from 'lucide-react';

interface BreadStatsProps {
    orders?: BreadOrderWithClient[];
}

export function BreadStats({ orders }: BreadStatsProps) {
    const stats = useMemo(() => {
        if (!orders) return { ordered: 0, delivered: 0, remaining: 0 };
        const ordered = orders.reduce((sum, o) => sum + o.quantite, 0);
        const delivered = orders.filter(o => o.statut === 'livre' || o.statut === 'paye').reduce((sum, o) => sum + o.quantite, 0);
        return {
            ordered,
            delivered,
            remaining: ordered - delivered,
        };
    }, [orders]);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commandé</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.ordered}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Livré</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{stats.delivered}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reste à Livrer</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{stats.remaining}</div>
                </CardContent>
            </Card>
        </div>
    );
}
