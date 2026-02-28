'use client';

import type { Product } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    selectedProducts: Set<number>;
    onToggleProductSelection: (productId: number) => void;
    onToggleSelectAll: () => void;
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) {
        return placeholders[category];
    }
    return placeholders.default;
};

export function ProductTable({ products, onEdit, onDelete, selectedProducts, onToggleProductSelection, onToggleSelectAll }: ProductTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] px-4">
                           <Checkbox
                                checked={products.length > 0 && selectedProducts.size === products.length}
                                onCheckedChange={onToggleSelectAll}
                                disabled={products.length === 0}
                                aria-label="Select all rows"
                            />
                        </TableHead>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Nom du Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Prix d'Achat</TableHead>
                        <TableHead className="text-right">Prix de Vente</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map(product => {
                        const isLowStock = product.quantity <= product.minStockLevel;
                        const placeholder = getPlaceholder(product.category);
                        const imageUrl = product.imageUrl || placeholder.url;

                        return (
                            <TableRow key={product.id} data-state={selectedProducts.has(product.id!) ? "selected" : ""}>
                                 <TableCell className="px-4">
                                    <Checkbox
                                        checked={selectedProducts.has(product.id!)}
                                        onCheckedChange={() => onToggleProductSelection(product.id!)}
                                        aria-label={`Select row for ${product.name}`}
                                    />
                                </TableCell>
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
                                <TableCell className={cn("text-center font-semibold", isLowStock && "text-destructive")}>
                                    <div className="flex items-center justify-center gap-2">
                                        {isLowStock && <AlertCircle className="h-4 w-4" />}
                                        {product.quantity}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{product.purchasePrice.toFixed(1)} DA</TableCell>
                                <TableCell className="text-right font-bold text-primary">{product.price.toFixed(1)} DA</TableCell>
                                <TableCell className="text-right">
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
                                            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
