'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GlobalActivityItem } from '@/lib/types';
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ShoppingBag, Package, Undo2, UserPlus, HandCoins } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";

const iconMap: { [key: string]: React.ElementType } = {
    sale: ShoppingBag,
    stock_intake: Package,
    return: Undo2,
    customer: UserPlus,
    payment: HandCoins,
};

export function RecentActivityCard({ activities }: { activities: GlobalActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
        <CardDescription>Les 10 dernières opérations enregistrées.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune activité récente.</p>
        ) : (
            <ScrollArea className="h-80">
                <Timeline>
                {activities.map((item, index) => {
                    const Icon = iconMap[item.type] || ShoppingBag;
                    const isLast = index === activities.length - 1;
                    return (
                        <TimelineItem key={item.id}>
                            {!isLast && <TimelineConnector />}
                            <TimelineHeader>
                                <TimelineIcon>
                                    <Icon className="h-5 w-5" />
                                </TimelineIcon>
                                <TimelineTitle>{item.description}</TimelineTitle>
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: fr })}
                                </span>
                            </TimelineHeader>
                            <TimelineBody>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-muted-foreground truncate">{item.details}</p>
                                    {item.amount && (
                                        <p className={`font-semibold whitespace-nowrap ${item.amountClass}`}>
                                            {item.amount > 0 ? `+ ${formatCurrency(item.amount)}` : `- ${formatCurrency(Math.abs(item.amount))}`}
                                        </p>
                                    )}
                                </div>
                            </TimelineBody>
                        </TimelineItem>
                    )
                })}
                </Timeline>
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
