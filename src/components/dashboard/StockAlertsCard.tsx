'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product } from '@/lib/types';
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function StockAlertsCard({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertes de Stock Faible</CardTitle>
        <CardDescription>Produits qui ont atteint ou sont en dessous du seuil minimum.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucun produit en stock faible.</p>
        ) : (
          <ScrollArea className="h-60">
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: <span className="font-bold text-destructive">{product.quantity}</span> / Seuil: {product.minStockLevel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      {products.length > 0 && (
        <CardContent>
             <Button asChild className="w-full">
                <Link href="/products?stockStatus=low_stock">
                    <AlertTriangle className="mr-2 h-4 w-4" /> Voir tous les produits en alerte
                </Link>
            </Button>
        </CardContent>
      )}
    </Card>
  );
}
