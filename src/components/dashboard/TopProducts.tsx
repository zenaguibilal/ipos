
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopProduct } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Package, TrendingUp } from "lucide-react";

interface TopProductsProps {
    products: TopProduct[];
    isLoading: boolean;
}

export default function TopProducts({ products, isLoading }: TopProductsProps) {
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
        <CardTitle>Produits Phares</CardTitle>
        <CardDescription>
          Les produits les plus rentables de la période.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {products.length > 0 ? (
            <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-primary/5">
                <div className="flex-grow space-y-1">
                  <p className="text-sm font-medium leading-none">{product.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Package className="h-3 w-3" /> {product.unitsSold} unités vendues
                  </p>
                </div>
                <div className="ml-auto font-medium text-right">
                    <p className="font-bold text-primary">{formatCurrency(product.totalRevenue)}</p>
                    <p className="text-xs text-green-500 font-semibold flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(product.totalProfit)}
                    </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-primary/20">
                <p className="text-muted-foreground">Pas assez de données de produits.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
