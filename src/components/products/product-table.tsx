'use client';

import type { Product, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, AlertCircle, PackageX, CalendarClock, Copy, History } from 'lucide-react';
import Image from 'next/image';
import { cn, formatCurrency, getPlaceholder } from '@/lib/utils';
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onViewHistory: (product: Product) => void;
    suppliers: Supplier[];
}

export function ProductTable({ products, onEdit, onDelete, onDuplicate, onViewHistory, suppliers }: ProductTableProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.uuid, s.name])), [suppliers]);

    const handleRowClick = (product: Product) => {
        if (!isManagerOrAdmin) return;
        onEdit(product);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Nom du Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Date Exp.</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Prix d'Achat</TableHead>
                        <TableHead className="text-right">Prix de Vente</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => {
                        const placeholder = getPlaceholder(product.category);
                        const imageUrl = product.imageUrl || placeholder.url;

                        const expirationStatus = (() => {
                            if (!product.dateExpiration) return null;
                            const today = new Date();
                            const expirationDate = new Date(product.dateExpiration);
                            const daysUntilExpiration = differenceInDays(expirationDate, today);
                            if (daysUntilExpiration < 0) return { color: 'text-destructive', text: `Expiré` };
                            if (daysUntilExpiration <= 30) return { color: 'text-yellow-500', text: `Expire dans ${daysUntilExpiration} j` };
                            return { color: 'text-muted-foreground', text: new Date(expirationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) };
                        })();
                        
                        const isPriceOld = product.dateMajPrix && differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;

                        return (
                            <TableRow 
                                key={product.uuid} 
                                onClick={() => handleRowClick(product)}
                                className={cn(isManagerOrAdmin && "cursor-pointer")}
                            >
                                <TableCell>
                                    <Image
                                        src={imageUrl}
                                        alt={product.name}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover h-10 w-10"
                                        data-ai-hint={product.imageUrl ? product.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category || 'N/A'}</TableCell>
                                <TableCell>{product.supplierUuid ? supplierMap.get(product.supplierUuid) : 'N/A'}</TableCell>
                                <TableCell className={cn("text-xs font-semibold", expirationStatus?.color)}>
                                    {expirationStatus ? (
                                        <div className="flex items-center gap-1">
                                            <CalendarClock className="h-3 w-3" />
                                            {expirationStatus.text}
                                        </div>
                                    ) : 'N/A'}
                                </TableCell>
                                <TableCell className="text-center font-semibold">
                                    <div className="flex items-center justify-center gap-1">
                                        {product.quantity <= 0 ? (
                                            <div className="flex items-center justify-center gap-1 text-destructive">
                                                <PackageX className="h-4 w-4" />
                                                <span>{product.quantity}</span>
                                            </div>
                                        ) : product.quantity <= product.minStockLevel ? (
                                            <div className="flex items-center justify-center gap-1 text-chart-secondary">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>{product.quantity}</span>
                                            </div>
                                        ) : (
                                            <span>{product.quantity}</span>
                                        )}
                                         <span className="text-xs text-muted-foreground">{product.unite}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {isPriceOld && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertCircle className="h-3 w-3 text-chart-secondary" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Prix d'achat non mis à jour depuis plus de 30 jours.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {formatCurrency(product.purchasePrice)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">{formatCurrency(product.price)}</TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    {isManagerOrAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(product)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDuplicate(product)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Dupliquer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onViewHistory(product)}>
                                                    <History className="mr-2 h-4 w-4" /> Historique Stock
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}