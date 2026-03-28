
'use client';

import React, { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, CalendarClock, Copy, History, Tag } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, getPlaceholder } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onViewHistory: (product: Product) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const ProductCardComponent = ({ product, onEdit, onDelete, onDuplicate, onViewHistory, isSelected, onToggleSelection }: ProductCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const placeholder = getPlaceholder(product.category);
    const imageUrl = product.imageUrl || placeholder.url;

    const expirationStatus = useMemo(() => {
        if (!product.dateExpiration) return null;
        const today = new Date();
        const expirationDate = new Date(product.dateExpiration);
        const daysUntilExpiration = differenceInDays(expirationDate, today);
        if (daysUntilExpiration < 0) return { color: 'bg-destructive text-destructive-foreground', text: `Expiré` };
        if (daysUntilExpiration <= 30) return { color: 'bg-yellow-500 text-black', text: `Expire dans ${daysUntilExpiration} j` };
        return null;
    }, [product.dateExpiration]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (!isManagerOrAdmin) return;
        if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('button')) return;
        onEdit(product);
    };

    return (
        <Card
            onClick={handleCardClick}
            className={cn(
                "flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative group luxury-glass border-white/5 overflow-hidden",
                isManagerOrAdmin && "cursor-pointer",
                isSelected && "ring-2 ring-primary border-primary/50 bg-primary/5 shadow-primary/10"
            )}
        >
            <div className={cn(
                "absolute top-3 left-3 z-10 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={onToggleSelection} 
                    className="h-5 w-5 bg-background shadow-lg border-primary/30" 
                />
            </div>

            <CardHeader className="p-0 relative h-40">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="rounded-t-lg object-cover group-hover:scale-105 transition-transform duration-700"
                    data-ai-hint={product.imageUrl ? product.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
                />
                 <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {product.quantity <= 0 ? (
                        <Badge variant="destructive" className="font-black uppercase text-[9px] tracking-widest">Rupture</Badge>
                    ) : product.quantity <= product.minStockLevel ? (
                        <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10 font-black uppercase text-[9px] tracking-widest">Faible</Badge>
                    ) : null}
                     {expirationStatus && (
                        <Badge className={cn("font-black uppercase text-[9px] tracking-widest", expirationStatus.color)}>
                            <CalendarClock className="h-3 w-3 mr-1" />
                            {expirationStatus.text}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-2">
                <div className="flex gap-2 justify-between items-start">
                    <div className="flex-grow overflow-hidden">
                        <CardTitle className="text-sm font-black uppercase tracking-tight truncate">{product.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">{product.category || 'Non classé'}</p>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                 <div>
                    <p className="text-xl font-black text-primary tracking-tighter">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Stock: <span className="text-foreground">{product.quantity} {product.unite || ''}</span></p>
                </div>
                {isManagerOrAdmin && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass">
                            <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2 font-bold">
                                <Edit className="h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(product)} className="gap-2 font-bold">
                                <Copy className="h-4 w-4" /> Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewHistory(product)} className="gap-2 font-bold">
                                <History className="h-4 w-4" /> Historique Flux
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 font-bold">
                                <Trash2 className="h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardFooter>
        </Card>
    );
}

export const ProductCard = React.memo(ProductCardComponent);
