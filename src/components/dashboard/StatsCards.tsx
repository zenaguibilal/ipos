
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingBag, BarChart, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
    stats?: {
      totalRevenue: number;
      totalProfit: number;
      salesCount: number;
      inventoryValue: number;
    };
    isLoading: boolean;
}

const StatCard = ({ title, value, icon: Icon, isLoading, format = true, isPrimary = false }: { title: string, value?: number, icon: React.ElementType, isLoading: boolean, format?: boolean, isPrimary?: boolean }) => {
    return (
        <div className={cn("luxury-glass p-6 rounded-3xl transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1", isPrimary && "bg-primary/10 shadow-primary/10")}>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2">
                {isLoading || value === undefined ? (
                     <Skeleton className="h-8 w-3/4" />
                ) : (
                    <p className="text-3xl font-bold">
                        {format ? formatCurrency(value) : value}
                    </p>
                )}
            </div>
        </div>
    )
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Revenu Total" 
                value={stats?.totalRevenue} 
                icon={DollarSign}
                isLoading={isLoading}
                isPrimary={true}
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
