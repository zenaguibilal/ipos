'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TopProduct } from '@/lib/types';
import { formatCurrency } from "@/lib/utils";

export function TopProductsCard({ products }: { products: TopProduct[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Produits</CardTitle>
        <CardDescription>Les produits les plus vendus par revenu.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune donnée de vente.</p>
        ) : (
          <ScrollArea className="h-60">
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.unitsSold} unités vendues
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-right">
                    <p>{formatCurrency(product.totalRevenue)}</p>
                    <p className="text-xs text-primary">{formatCurrency(product.totalProfit)} profit</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
