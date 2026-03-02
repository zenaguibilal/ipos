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
                <div className="space-y-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className="space-y-1 flex-grow">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                            <div className="ml-auto text-right">
                                <Skeleton className="h-5 w-[60px] mb-1" />
                                <Skeleton className="h-3 w-[80px]" />
                            </div>
                        </div>
                    ))}
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
          Les {recentSales.length > 0 ? recentSales.length : 'dernières'} transactions de la période.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSales.length > 0 ? (
            <div className="space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-start">
                <div className="space-y-1 flex-grow">
                  <p className="text-sm font-medium leading-none">{sale.customerName || 'Client de passage'}</p>
                  <p className="text-sm text-muted-foreground">
                    Facture {sale.invoiceNumber}
                  </p>
                </div>
                <div className="ml-auto font-medium text-right">
                    <p>{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-muted-foreground font-normal">{formatDistanceToNow(safeToDate(sale.createdAt!), { addSuffix: true, locale: fr })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="flex h-[200px] w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Aucune vente dans cette période.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
