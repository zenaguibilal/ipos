'use client';

import type { Product, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, AlertCircle, PackageX, CalendarClock, Copy, History, Tag } from 'lucide-react';
import Image from 'next/image';
import { cn, formatCurrency, getPlaceholder } from '@/lib/utils';
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onDuplicate: (product: Product) => void;
    onViewHistory: (product: Product) => void;
    suppliers: Supplier[];
    selectedProducts: Set<string>;
    onToggleSelection: (uuid: string) => void;
    onToggleAll: () => void;
}

export function ProductTable({ 
    products, onEdit, onDelete, onDuplicate, onViewHistory, suppliers, 
    selectedProducts, onToggleSelection, onToggleAll 
}: ProductTableProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.uuid, s.name])), [suppliers]);

    return (
        <div className="rounded-2xl border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="w-12 px-4">
                            <Checkbox 
                                checked={products.length > 0 && selectedProducts.size === products.length} 
                                onCheckedChange={onToggleAll} 
                            />
                        </TableHead>
                        <TableHead className="w-[80px] font-black uppercase text-[10px] tracking-widest text-muted-foreground py-5">Aperçu</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Désignation Produit</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Rayon</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground hidden lg:table-cell">Fournisseur</TableHead>
                        <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Quantité</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground">Prix Achat</TableHead>
                        <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground">Prix Vente</TableHead>
                        <TableHead className="w-[80px] text-right font-black uppercase text-[10px] tracking-widest text-muted-foreground px-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => {
                        const placeholder = getPlaceholder(product.category);
                        const imageUrl = product.imageUrl || placeholder.url;
                        const isSelected = selectedProducts.has(product.uuid);

                        const expirationStatus = (() => {
                            if (!product.dateExpiration) return null;
                            const today = new Date();
                            const expirationDate = new Date(product.dateExpiration);
                            const daysUntilExpiration = differenceInDays(expirationDate, today);
                            if (daysUntilExpiration < 0) return { color: 'text-destructive', text: `Expiré` };
                            if (daysUntilExpiration <= 30) return { color: 'text-orange-500', text: `Expire dans ${daysUntilExpiration} j` };
                            return null;
                        })();
                        
                        const isPriceOld = product.dateMajPrix && differenceInDays(new Date(), new Date(product.dateMajPrix)) > 30;

                        return (
                            <TableRow 
                                key={product.uuid} 
                                className={cn(
                                    "hover:bg-primary/5 transition-colors border-white/5 group",
                                    isSelected && "bg-primary/10"
                                )}
                            >
                                <TableCell className="px-4">
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => onToggleSelection(product.uuid)} 
                                    />
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="h-12 w-12 rounded-xl overflow-hidden relative border border-white/10 group-hover:scale-110 transition-transform">
                                        <Image
                                            src={imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={product.imageUrl ? product.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{product.name}</span>
                                        {expirationStatus && (
                                            <span className={cn("text-[9px] font-black uppercase flex items-center gap-1", expirationStatus.color)}>
                                                <CalendarClock className="h-2.5 w-2.5" />
                                                {expirationStatus.text}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg border border-white/5">
                                        {product.category || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {product.supplierUuid ? supplierMap.get(product.supplierUuid) : '-'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                    <div className="flex flex-col items-center">
                                        {product.quantity <= 0 ? (
                                            <span className="text-destructive flex items-center gap-1">
                                                <PackageX className="h-3.5 w-3.5" />
                                                {product.quantity}
                                            </span>
                                        ) : product.quantity <= product.minStockLevel ? (
                                            <span className="text-orange-500 flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {product.quantity}
                                            </span>
                                        ) : (
                                            <span>{product.quantity}</span>
                                        )}
                                         <span className="text-[9px] text-muted-foreground uppercase opacity-60">{product.unite}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1 font-mono text-xs opacity-70">
                                        {isPriceOld && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger><AlertCircle className="h-3 w-3 text-orange-500" /></TooltipTrigger>
                                                    <TooltipContent className="luxury-glass">Prix ancien (+30j)</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {formatCurrency(product.purchasePrice)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-primary text-sm">{formatCurrency(product.price)}</span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    {isManagerOrAdmin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all">
                                                    <MoreHorizontal className="h-4.5 w-4.5" />
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
                                                    <History className="h-4 w-4" /> Historique Stock
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {}} className="gap-2 font-bold">
                                                    <Tag className="h-4 w-4 text-primary" /> Étiquette
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 font-bold">
                                                    <Trash2 className="h-4 w-4" /> Supprimer
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
