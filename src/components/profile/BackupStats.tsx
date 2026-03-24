'use client';

import { Card } from '@/components/ui/card';
import { Package, Users, ShoppingCart } from 'lucide-react';

interface BackupStatsProps {
    stats?: {
        products: number;
        customers: number;
        sales: number;
    } | null;
}

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: number | string }) => (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <Icon className="h-6 w-6 text-primary" />
        <div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    </div>
);

export function BackupStats({ stats }: BackupStatsProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatItem icon={Package} label="Produits" value={stats?.products ?? '...'} />
            <StatItem icon={Users} label="Clients" value={stats?.customers ?? '...'} />
            <StatItem icon={ShoppingCart} label="Ventes" value={stats?.sales ?? '...'} />
        </div>
    );
}
