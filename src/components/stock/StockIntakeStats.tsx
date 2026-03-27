'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockIntake } from '@/lib/types';
import { Wallet, Archive, Building, Truck, TrendingUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface StockIntakeStatsProps {
    intakes: StockIntake[] | undefined;
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, desc }: { title: string, value: string, icon: any, colorClass: string, desc: string }) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 opacity-50", colorClass.replace('bg-', 'text-'))} />
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{desc}</p>
        </CardContent>
    </Card>
);

export const StockIntakeStats = ({ intakes, isLoading }: StockIntakeStatsProps) => {
    const stats = useMemo(() => {
        if (!intakes) return { totalValue: 0, intakeCount: 0, supplierCount: 0, totalTransport: 0 };
        const supplierUuids = new Set(intakes.map(i => i.supplierUuid).filter(Boolean));
        return {
            totalValue: intakes.reduce((sum, i) => sum + i.totalValue, 0),
            intakeCount: intakes.length,
            supplierCount: supplierUuids.size,
            totalTransport: intakes.reduce((sum, i) => sum + (i.transportFees || 0), 0)
        };
    }, [intakes]);

    if (isLoading) {
        return (
             <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Flux Marchandise" 
                value={formatCurrency(stats.totalValue)} 
                icon={TrendingUp} 
                colorClass="bg-primary"
                desc="Valeur brute cumulée"
            />
            <StatCard 
                title="Logistique & Fret" 
                value={formatCurrency(stats.totalTransport)} 
                icon={Truck} 
                colorClass="bg-orange-500"
                desc="Investissement transport"
            />
            <StatCard 
                title="Volume Réceptions" 
                value={String(stats.intakeCount)} 
                icon={Archive} 
                colorClass="bg-blue-500"
                desc="Bons enregistrés"
            />
            <StatCard 
                title="Partenaires" 
                value={String(stats.supplierCount)} 
                icon={Building} 
                colorClass="bg-chart-quaternary"
                desc="Fournisseurs actifs"
            />
        </div>
    );
};
