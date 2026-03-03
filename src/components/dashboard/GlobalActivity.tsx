
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GlobalActivityItem } from "@/lib/types";
import { formatCurrency, safeToDate } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShoppingBag, Package, UserPlus, Undo2, Archive, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";

interface GlobalActivityProps {
    activity: GlobalActivityItem[];
    isLoading: boolean;
}

const iconMap = {
    sale: ShoppingBag,
    stock_intake: Archive,
    return: Undo2,
    customer: UserPlus,
};

export default function GlobalActivity({ activity, isLoading }: GlobalActivityProps) {
  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
        <CardDescription>
          Les dernières opérations enregistrées dans le système.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {activity.length > 0 ? (
            <div className="space-y-2">
            {activity.map((item) => {
                const Icon = iconMap[item.type] || Activity;
                const iconContainerClass = {
                    sale: 'text-primary bg-primary/10',
                    stock_intake: 'text-[hsl(var(--chart-quaternary))] bg-[hsl(var(--chart-quaternary)/0.1)]',
                    return: 'text-destructive bg-destructive/10',
                    customer: 'text-[hsl(var(--chart-quinary))] bg-[hsl(var(--chart-quinary)/0.1)]',
                }[item.type] || 'text-muted-foreground bg-muted';

                return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-primary/5">
                        <div className={cn("p-2 rounded-full", iconContainerClass)}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-grow space-y-1">
                            <p className="text-sm font-medium leading-none">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                                {item.details}
                            </p>
                        </div>
                        <div className="ml-auto text-right">
                             {typeof item.amount === 'number' && (
                                <p className={cn("font-bold text-sm", item.amountClass)}>{formatCurrency(item.amount)}</p>
                             )}
                            <p className="text-xs text-muted-foreground font-normal">{formatDistanceToNow(safeToDate(item.date!), { addSuffix: true, locale: fr })}</p>
                        </div>
                    </div>
                );
            })}
          </div>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-primary/20">
                 <Activity className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune activité récente.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
