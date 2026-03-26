
'use client';

import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Truck, Clock, HandCoins, ShoppingBag } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

interface BreadStatsProps {
    orders?: BreadOrder[];
    isLoading: boolean;
}

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const breadPrice = useAppStore((state) => state.profile?.prix_pain) || 0;

    const stats = useMemo(() => {
        if (!orders) return { ordered: 0, delivered: 0, billed: 0, potentialRevenue: 0 };
        const ordered = orders.reduce((sum, o) => sum + o.quantite, 0);
        const delivered = orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0);
        const billed = orders.filter(o => !!o.venteUuid).reduce((sum, o) => sum + o.quantite, 0);
        
        return {
            ordered,
            delivered,
            billed,
            potentialRevenue: ordered * breadPrice,
        };
    }, [orders, breadPrice]);

    if(isLoading && !orders) {
        return (
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="luxury-glass border-primary/10 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/70">Total Commandé</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black">{stats.ordered} <span className="text-xs font-medium text-muted-foreground uppercase">unités</span></div>
                </CardContent>
            </Card>

            <Card className="luxury-glass border-chart-quaternary/10 bg-chart-quaternary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-chart-quaternary/70">Livré & OK</CardTitle>
                    <Truck className="h-4 w-4 text-chart-quaternary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-chart-quaternary">{stats.delivered}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Reste: {stats.ordered - stats.delivered} pains</p>
                </CardContent>
            </Card>

            <Card className="luxury-glass border-blue-500/10 bg-blue-500/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400/70">Déjà Facturé</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-blue-400">{stats.billed}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Non facturé: {stats.ordered - stats.billed}</p>
                </CardContent>
            </Card>

            <Card className="luxury-glass border-chart-secondary/10 bg-chart-secondary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-chart-secondary/70">Chiffre Prévu</CardTitle>
                    <HandCoins className="h-4 w-4 text-chart-secondary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-chart-secondary">{formatCurrency(stats.potentialRevenue)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">À {breadPrice} DA l'unité</p>
                </CardContent>
            </Card>
        </div>
    );
}
