'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, Hourglass } from 'lucide-react';
import type { CustomerWithSalesData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';


interface CustomerMetricsProps {
    metrics: {
        totalSpent: number;
        outstandingBalance: number;
    }
}

export function CustomerMetrics({ metrics }: CustomerMetricsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Statistiques du Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Dépensé</p>
                            <p className="text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</p>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-destructive/20">
                            <Hourglass className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm text-destructive/80">Solde Impayé</p>
                            <p className="text-2xl font-bold text-destructive">{formatCurrency(metrics.outstandingBalance)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
