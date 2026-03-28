'use client';

import { useMemo } from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Truck, ShoppingBag, TrendingUp, Banknote, Clock, Wheat } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, cn } from '@/lib/utils';

interface BreadStatsProps {
    orders?: BreadOrder[];
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, desc, subValue, trend }: any) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 opacity-50", colorClass)} />
        </CardHeader>
        <CardContent className="relative z-10">
            <div className={cn("text-2xl font-black tracking-tight", colorClass)}>{value}</div>
            <div className="flex items-center justify-between mt-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 italic">{desc}</p>
                {subValue && <span className="text-[10px] font-black text-foreground/40">{subValue}</span>}
            </div>
            {trend && (
                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full transition-all duration-1000", colorClass.replace('text-', 'bg-'))}
                        style={{ width: `${trend}%` }}
                    />
                </div>
            )}
        </CardContent>
    </Card>
);

export function BreadStats({ orders, isLoading }: BreadStatsProps) {
    const breadPrice = useAppStore((state) => state.profile?.prix_pain) || 0;

    const stats = useMemo(() => {
        if (!orders) return { ordered: 0, delivered: 0, billed: 0, potentialRevenue: 0, billedRevenue: 0, deliveryRate: 0 };
        const ordered = orders.reduce((sum, o) => sum + o.quantite, 0);
        const delivered = orders.filter(o => o.est_livre).reduce((sum, o) => sum + o.quantite, 0);
        const billedOrders = orders.filter(o => !!o.venteUuid);
        const billed = billedOrders.reduce((sum, o) => sum + o.quantite, 0);
        
        return {
            ordered,
            delivered,
            billed,
            potentialRevenue: ordered * breadPrice,
            billedRevenue: billed * breadPrice,
            deliveryRate: ordered > 0 ? (delivered / ordered) * 100 : 0
        };
    }, [orders, breadPrice]);

    if(isLoading && !orders) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Volume Total Attendu" 
                value={`${stats.ordered} Pains`} 
                icon={Wheat} 
                colorClass="text-primary"
                desc="Flux théorique du jour"
                subValue={`${orders?.length || 0} Bons`}
            />
            
            <StatCard 
                title="Indice de Livraison" 
                value={`${Math.round(stats.deliveryRate)}%`} 
                icon={Truck} 
                colorClass="text-blue-400"
                desc={`${stats.delivered} unités expédiées`}
                trend={stats.deliveryRate}
            />

            <StatCard 
                title="Facturation M.A.C" 
                value={`${stats.billed} Un.`} 
                icon={ShoppingBag} 
                colorClass="text-chart-quaternary"
                desc={`${stats.ordered - stats.billed} en attente MAC`}
                subValue={formatCurrency(stats.billedRevenue)}
            />

            <StatCard 
                title="C.A Prévisionnel" 
                value={formatCurrency(stats.potentialRevenue)} 
                icon={TrendingUp} 
                colorClass="text-chart-secondary"
                desc="Valeur brute du planning"
                subValue={`P.U: ${breadPrice} DA`}
            />
        </div>
    );
}
