'use client';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface ProductGridCardProps {
    product: Product;
    onClick: () => void;
    isInCart: boolean;
}

export function ProductGridCard({ product, onClick, isInCart }: ProductGridCardProps) {
    const isOutOfStock = product.quantity === 0;
    const isLowStock = !isOutOfStock && product.quantity <= product.minStockLevel;

    return (
        <Card
            onClick={!isOutOfStock ? onClick : undefined}
            className={cn(
                "overflow-hidden transition-all duration-200 cursor-pointer group",
                isOutOfStock && "opacity-50 cursor-not-allowed",
                isInCart && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                !isOutOfStock && "hover:shadow-lg hover:-translate-y-1"
            )}
        >
            <CardHeader className="p-0 relative">
                <div className="aspect-square relative">
                    <Image
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/300`}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                        className="object-cover"
                        data-ai-hint={product.name.split(' ').slice(0, 2).join(' ')}
                    />
                    {isInCart && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <Badge>Dans le panier</Badge>
                        </div>
                    )}
                </div>
                {isOutOfStock && <Badge variant="destructive" className="absolute top-2 right-2">Épuisé</Badge>}
                {isLowStock && <Badge variant="secondary" className="absolute top-2 right-2">Stock Faible</Badge>}
            </CardHeader>
            <CardContent className="p-3">
                <p className="font-semibold leading-tight truncate group-hover:text-primary">{product.name}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Eye className="h-3 w-3 mr-1" />
                    <span>{product.quantity} en stock</span>
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 bg-muted/50">
                <p className="text-lg font-bold text-primary w-full text-center">{product.price.toFixed(1)} DA</p>
            </CardFooter>
        </Card>
    );
}
