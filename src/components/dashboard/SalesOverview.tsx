'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sale } from "@/lib/types";
import { formatCurrency, safeToDate } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SalesOverviewProps {
    sales: Sale[];
    isLoading: boolean;
}

export default function SalesOverview({ sales, isLoading }: SalesOverviewProps) {

  const recentSales = sales.slice(0, 5);

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
        <CardTitle>Ventes Récentes</CardTitle>
        <CardDescription>
          Les {recentSales.length > 0 ? recentSales.length : ''} dernières transactions de la période.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {recentSales.length > 0 ? (
            <div className="space-y-2">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center p-3 rounded-lg transition-colors hover:bg-primary/5">
                <div className="flex-grow space-y-1">
                  <p className="text-sm font-medium leading-none">{sale.customerName || 'Client de passage'}</p>
                  <p className="text-xs text-muted-foreground">
                    #{sale.invoiceNumber}
                  </p>
                </div>
                <div className="ml-auto font-medium text-right">
                    <p className="font-bold text-primary">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-muted-foreground font-normal">{formatDistanceToNow(safeToDate(sale.createdAt!), { addSuffix: true, locale: fr })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-primary/20">
                <p className="text-muted-foreground">Aucune vente dans cette période.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
