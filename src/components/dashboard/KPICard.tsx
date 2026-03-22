'use client';

import { useTheme } from 'next-themes';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: number;
    change?: number;
    subtitle?: string;
    icon: React.ElementType;
    format: 'currency' | 'number';
}

export function KPICard({ title, value, change, subtitle, icon: Icon, format }: KPICardProps) {
    const cardClass = 'luxury-glass';
    
    const hasChange = typeof change === 'number' && isFinite(change);
    const isPositive = hasChange && change >= 0;

    return (
        <div className={cn('relative overflow-hidden p-6', cardClass)}>
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold">
                        {format === 'currency' ? formatCurrency(value) : value.toLocaleString('fr-FR')}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
                {hasChange ? (
                    <div className={cn(
                        "flex items-center gap-1",
                        isPositive ? "text-green-500" : "text-destructive"
                    )}>
                        {change !== 0 && (isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                        <span>{Math.abs(change).toFixed(1)}% vs. période préc.</span>
                    </div>
                ) : (
                    <span>{subtitle}</span>
                )}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/50 orange-glow opacity-50" />
        </div>
    );
}
