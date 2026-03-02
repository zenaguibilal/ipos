'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingBag, BarChart, Archive } from "lucide-react";

interface StatsCardsProps {
    stats?: DashboardStats;
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, isLoading, format = true }: { title: string, value?: number, icon: React.ElementType, isLoading: boolean, format?: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading || value === undefined ? (
                     <Skeleton className="h-8 w-3/4" />
                ) : (
                    <div className="text-2xl font-bold">
                        {format ? formatCurrency(value) : value}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Revenu Total" 
                value={stats?.totalRevenue} 
                icon={DollarSign}
                isLoading={isLoading}
            />
            <StatCard 
                title="Bénéfice Net" 
                value={stats?.totalProfit} 
                icon={BarChart}
                isLoading={isLoading}
            />
             <StatCard 
                title="Nombre de Ventes" 
                value={stats?.salesCount} 
                icon={ShoppingBag}
                isLoading={isLoading}
                format={false}
            />
             <StatCard 
                title="Valeur du Stock" 
                value={stats?.inventoryValue} 
                icon={Archive}
                isLoading={isLoading}
            />
        </div>
    )
}
