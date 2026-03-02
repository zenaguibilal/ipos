'use client';

import React from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import placeholderImages from '@/lib/placeholder-images.json';
import { cn, formatCurrency } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) {
        return placeholders[category];
    }
    return placeholders.default;
};

const ProductCardComponent = ({ product, onEdit, onDelete, isSelected, onToggleSelection }: ProductCardProps) => {
    const isLowStock = product.quantity <= product.minStockLevel;
    const placeholder = getPlaceholder(product.category);
    const imageUrl = product.imageUrl || placeholder.url;

    return (
        <Card className={cn("flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", isSelected && "ring-2 ring-primary")}>
            <CardHeader className="p-0 relative">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    width={placeholder.width}
                    height={placeholder.height}
                    className="rounded-t-lg object-cover aspect-[4/3]"
                    data-ai-hint={product.imageUrl ? product.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
                />
                 {isLowStock && (
                     <Badge variant="destructive" className="absolute top-2 right-2">Stock Faible</Badge>
                 )}
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <div className="flex gap-2 justify-between items-start">
                    <div className="flex-grow">
                        <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{product.category || 'Non classé'}</p>
                    </div>
                     <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelection}
                        className="h-5 w-5 flex-shrink-0"
                        aria-label={`Select ${product.name}`}
                    />
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                 <div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                    <p className="text-xs font-semibold">Stock: {product.quantity}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
