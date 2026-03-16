
'use client';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function StockAlertsCard({ alerts }: { alerts: Product[] }) {
    const { theme } = useTheme();
    const cardClass = theme === 'light' ? 'glass-card-light' : 'glass-card-dark';

    return (
        <div className={cn('glass-card h-full flex flex-col p-6', cardClass)}>
            <h3 className="text-xl font-semibold mb-4">Alertes de Stock</h3>
            {alerts.length > 0 ? (
                <div className="flex-grow space-y-3 overflow-y-auto -mr-2 pr-2">
                    {alerts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <span className={cn(
                                "font-bold text-sm px-2 py-1 rounded-md",
                                product.quantity > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                            )}>
                                {product.quantity} / {product.minStockLevel}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">Aucune alerte de stock.</p>
                </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10">
                <Link href="/products?stockStatus=low_stock" className="text-sm font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-2">
                    Voir tout <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
