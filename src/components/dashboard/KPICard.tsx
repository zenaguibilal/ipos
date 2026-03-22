'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardStats } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface KPICardProps {
    stats: DashboardStats;
}

const StatCard = ({ title, value, icon: Icon, currency = false }: { title: string, value: number, icon: React.ElementType, currency?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
                {currency ? formatCurrency(value) : value}
            </div>
        </CardContent>
    </Card>
);

export function KPICard({ stats }: KPICardProps) {
    return (
        <>
            <StatCard title="Revenu Total" value={stats.totalRevenue} icon={DollarSign} currency />
            <StatCard title="Profit Net" value={stats.totalProfit} icon={TrendingUp} currency />
            <StatCard title="Dépenses" value={stats.totalExpenses} icon={TrendingDown} currency />
            <StatCard title="Nombre de Ventes" value={stats.salesCount} icon={ShoppingCart} />
            <StatCard title="Valeur du Stock" value={stats.inventoryValue} icon={Package} currency />
        </>
    );
}
