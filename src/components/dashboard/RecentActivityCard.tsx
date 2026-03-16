'use client';
import { useTheme } from 'next-themes';
import { cn, formatCurrency, safeToDate } from '@/lib/utils';
import type { GlobalActivityItem } from '@/lib/types';
import { ShoppingBag, Archive, UserPlus, Undo2, Activity, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

const iconMap = {
    sale: ShoppingBag,
    stock_intake: Archive,
    return: Undo2,
    customer: UserPlus,
};

const activityLinks = {
  sale: '/sales-history',
  stock_intake: '/stock',
  return: '/returns',
  customer: '/customers'
}

export function RecentActivityCard({ activities }: { activities: GlobalActivityItem[] }) {
    const { theme } = useTheme();
    const cardClass = theme === 'light' ? 'glass-card-light' : 'glass-card-dark';

    return (
        <div className={cn('glass-card h-full flex flex-col p-6', cardClass)}>
            <h3 className="text-xl font-semibold mb-4">Activité Récente</h3>
            {activities.length > 0 ? (
                <div className="flex-grow space-y-4 overflow-y-auto -mr-2 pr-2">
                    {activities.map((item) => {
                        const Icon = iconMap[item.type] || Activity;
                        const link = activityLinks[item.type];
                        return (
                            <Link href={link} key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-primary/10">
                                <div className="p-3 bg-muted rounded-lg">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-grow space-y-0.5">
                                    <p className="text-sm font-medium leading-none">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(safeToDate(item.date), { addSuffix: true, locale: fr })}
                                    </p>
                                </div>
                                {typeof item.amount === 'number' && (
                                    <p className={cn("ml-auto font-bold text-sm", item.amountClass || "text-foreground")}>{formatCurrency(item.amount)}</p>
                                )}
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">Aucune activité récente.</p>
                </div>
            )}
             <div className="mt-4 pt-4 border-t border-white/10">
                <Link href="/sales-history" className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-2">
                    Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
