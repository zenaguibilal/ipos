
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle, Hourglass, TrendingUp, CircleDollarSign } from 'lucide-react';
import type { BreadOrder } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

interface BreadStatsCardsProps {
  orders: BreadOrder[];
  breadPrice: number;
  isLoading: boolean;
}

export default function BreadStatsCards({ orders, breadPrice, isLoading }: BreadStatsCardsProps) {
    const stats = useMemo(() => {
        let totalOrdered = 0;
        let totalDelivered = 0;
        let totalCollected = 0;
        let totalDue = 0;

        for (const order of orders) {
            const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
            totalOrdered += quantity;
            
            if (order.todaysOrder?.isDelivered) {
                totalDelivered += quantity;
            }

            if (order.todaysOrder?.isPaid) {
                totalCollected += quantity * breadPrice;
            } else {
                totalDue += quantity * breadPrice;
            }
        }
        
        return {
            totalOrdered,
            totalDelivered,
            totalRemaining: totalOrdered - totalDelivered,
            totalCollected,
            totalDue,
        };
    }, [orders, breadPrice]);

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
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                     <CardTitle className="text-base text-green-800 dark:text-green-300">Analyse Financière</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <CircleDollarSign className="h-8 w-8 text-green-600"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Encaissé</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.totalCollected.toFixed(1)} DA</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <TrendingUp className="h-8 w-8 text-red-600"/>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Dû</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.totalDue.toFixed(1)} DA</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
