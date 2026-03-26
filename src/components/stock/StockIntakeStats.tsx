'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockIntake } from '@/lib/types';
import { Wallet, Archive, Building } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StockIntakeStatsProps {
    intakes: StockIntake[] | undefined;
    isLoading: boolean;
}

export const StockIntakeStats = ({ intakes, isLoading }: StockIntakeStatsProps) => {
    const stats = useMemo(() => {
        if (!intakes) return { totalValue: 0, intakeCount: 0, supplierCount: 0 };
        const supplierUuids = new Set(intakes.map(i => i.supplierUuid).filter(Boolean));
        return {
            totalValue: intakes.reduce((sum, i) => sum + i.totalValue, 0),
            intakeCount: intakes.length,
            supplierCount: supplierUuids.size,
        };
    }, [intakes]);

    if (isLoading) {
        return (
             <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valeur Totale Reçue</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nombre de Réceptions</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.intakeCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fournisseurs Distincts</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.supplierCount}</div>
                </CardContent>
            </Card>
        </div>
    );
};
