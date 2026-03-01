'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BellOff, PackageWarning } from 'lucide-react';

export interface StockNotification {
  id: string;
  type: 'stock';
  message: string;
  linkHref: string;
  product: Product;
}

export default function NotificationsPage() {
    const products = useLiveQuery(() => db.products.toArray());

    const lowStockNotifications = useMemo((): StockNotification[] => {
        if (!products) return [];
        return products
            .filter(p => p.id !== undefined && p.quantity <= p.minStockLevel)
            .map(p => ({
                id: `stock-${p.id}`,
                type: 'stock',
                message: `Stock faible pour ${p.name} (${p.quantity} restant).`,
                linkHref: `/products?search=${encodeURIComponent(p.name)}`,
                product: p,
            }));
    }, [products]);

    const isLoading = products === undefined;

    const totalNotifications = lowStockNotifications.length;

    return (
        <>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Centre de Notifications</h1>
                    <p className="text-muted-foreground">Alertes importantes concernant le stock.</p>
                </div>
                
                {totalNotifications === 0 && !isLoading ? (
                    <div className="flex h-60 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                        <div className="text-center">
                            <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-bold tracking-tight">Tout est en ordre !</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Aucune notification pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {lowStockNotifications.length > 0 && (
                             <Card>
                                <CardHeader>
                                    <CardTitle>Alertes de Stock Faible ({lowStockNotifications.length})</CardTitle>
                                    <CardDescription>Produits qui ont atteint ou sont en dessous du niveau de stock minimum.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     {lowStockNotifications.map(notification => (
                                        <div key={notification.id} className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900/30">
                                                <PackageWarning className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{notification.message}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <Button asChild variant="secondary" size="sm">
                                                    <Link href={notification.linkHref}>
                                                        Voir le produit <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}
