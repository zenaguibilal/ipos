'use client';
import { useTheme } from 'next-themes';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { Trophy } from 'lucide-react';
import Image from 'next/image';
import { getPlaceholder } from '@/lib/utils';

export function TopProductsCard({ products }: { products: (Product & { totalVendu: number })[] }) {
    const { theme } = useTheme();
    const cardClass = theme === 'light' ? 'glass-card-light' : 'glass-card-dark';

    return (
        <div className={cn('glass-card h-full flex flex-col p-6', cardClass)}>
            <h3 className="text-xl font-semibold mb-4">Produits Phares</h3>
            {products.length > 0 ? (
                <div className="flex-grow space-y-4">
                    {products.map((product, index) => {
                        const placeholder = getPlaceholder(product.category);
                        return (
                            <div key={product.id} className="flex items-center gap-4">
                                <span className={cn(
                                    "font-bold text-lg w-6 text-center",
                                    index === 0 && "text-primary orange-glow",
                                    index === 1 && "text-primary/70",
                                    index === 2 && "text-primary/50",
                                )}>
                                    {index + 1}
                                </span>
                                <Image
                                    src={product.imageUrl || placeholder.url}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-cover rounded-md"
                                />
                                <div className="flex-grow">
                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.totalVendu} unités vendues</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">Pas assez de données.</p>
                </div>
            )}
        </div>
    );
}
