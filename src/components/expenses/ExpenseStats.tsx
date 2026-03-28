
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense } from '@/lib/types';
import { Wallet, TrendingDown, Tag, Calendar, Activity } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface ExpenseStatsProps {
    expenses: Expense[] | undefined;
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, colorClass, desc, subValue }: { title: string, value: string, icon: any, colorClass: string, desc: string, subValue?: string }) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-destructive/20 transition-all group relative overflow-hidden">
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
        </CardContent>
    </Card>
);

export const ExpenseStats = ({ expenses, isLoading }: ExpenseStatsProps) => {
    const stats = useMemo(() => {
        if (!expenses || expenses.length === 0) return { total: 0, count: 0, topCategory: 'N/A', avgExpense: 0 };
        
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const count = expenses.length;
        const avgExpense = total / count;

        const categoryMap = new Map<string, number>();
        expenses.forEach(e => {
            categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
        });

        const topCategory = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return { total, count, topCategory, avgExpense };
    }, [expenses]);

    if (isLoading && !expenses) {
        return (
             <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2.5rem]" />)}
            </div>
        )
    }

    return (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Volume Sorties" 
                value={formatCurrency(stats.total)} 
                icon={TrendingDown} 
                colorClass="text-destructive"
                desc="Total charges période"
            />
            <StatCard 
                title="Pôle de Dépense" 
                value={stats.topCategory} 
                icon={Tag} 
                colorClass="text-orange-500"
                desc="Catégorie dominante"
            />
            <StatCard 
                title="Nombre de Flux" 
                value={String(stats.count)} 
                icon={Activity} 
                colorClass="text-blue-400"
                desc="Opérations comptables"
            />
            <StatCard 
                title="Charge Moyenne" 
                value={formatCurrency(stats.avgExpense)} 
                icon={Wallet} 
                colorClass="text-primary"
                desc="Valeur moyenne / ligne"
            />
        </div>
    );
};
