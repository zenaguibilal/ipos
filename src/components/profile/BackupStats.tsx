
'use client';

import { Card } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp, History, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupStatsProps {
    stats?: {
        products: number;
        customers: number;
        sales: number;
    } | null;
}

const StatItem = ({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: number | string, colorClass: string }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", colorClass)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
    </div>
);

export function BackupStats({ stats }: BackupStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatItem 
                icon={Package} 
                label="Produits" 
                value={stats?.products ?? '...'} 
                colorClass="bg-primary/20 text-primary"
            />
            <StatItem 
                icon={UserCheck} 
                label="Clients" 
                value={stats?.customers ?? '...'} 
                colorClass="bg-blue-500/20 text-blue-400"
            />
            <StatItem 
                icon={History} 
                label="Ventes" 
                value={stats?.sales ?? '...'} 
                colorClass="bg-chart-quaternary/20 text-chart-quaternary"
            />
        </div>
    );
}
