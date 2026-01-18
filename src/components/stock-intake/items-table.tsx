
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { StockIntakeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface IntakeItemsTableProps {
    items: StockIntakeItem[];
    onUpdateItem: (itemId: string, field: keyof StockIntakeItem, value: any) => void;
    onRemoveItem: (itemId: string) => void;
    errors: Record<string, Partial<Record<keyof StockIntakeItem, string>>>;
}

export function IntakeItemsTable({ items, onUpdateItem, onRemoveItem, errors }: IntakeItemsTableProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <h3 className="text-xl font-bold tracking-tight">
                    Aucun produit dans la liste de réception
                </h3>
                <p className="text-sm text-muted-foreground">
                    Utilisez le scanner ou la recherche pour ajouter des produits.
                </p>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Nom du produit</TableHead>
                            <TableHead className="w-[150px]">Catégorie</TableHead>
                            <TableHead className="w-[200px]">Codes-barres</TableHead>
                            <TableHead className="w-[100px]">Quantité</TableHead>
                            <TableHead className="w-[120px]">Prix d'achat (DA)</TableHead>
                            <TableHead className="w-[120px]">Prix de vente (DA)</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => {
                             const itemErrors = errors[item.id] || {};
                             return (
                                <TableRow key={item.id} className={cn(Object.keys(itemErrors).length > 0 && "bg-destructive/5")}>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                                                    placeholder="Nom du produit"
                                                    disabled={!item.isNew}
                                                    className={cn(
                                                        item.isNew ? "border-green-500" : "bg-muted/50",
                                                        itemErrors.name && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            {itemErrors.name && <TooltipContent><p>{itemErrors.name}</p></TooltipContent>}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.category || ''}
                                            onChange={(e) => onUpdateItem(item.id, 'category', e.target.value)}
                                            placeholder="Catégorie"
                                            disabled={!item.isNew}
                                            className={cn(!item.isNew && "bg-muted/50")}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={(item.barcodes || []).join(', ')}
                                            onChange={(e) => onUpdateItem(item.id, 'barcodes', e.target.value)}
                                            placeholder="ex: 123, 456"
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                                                    className={cn("text-right", itemErrors.quantity && "border-destructive focus-visible:ring-destructive")}
                                                    min="1"
                                                />
                                            </TooltipTrigger>
                                            {itemErrors.quantity && <TooltipContent><p>{itemErrors.quantity}</p></TooltipContent>}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    type="number"
                                                    value={item.purchasePrice}
                                                    onChange={(e) => onUpdateItem(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                                    className={cn("text-right", itemErrors.purchasePrice && "border-destructive focus-visible:ring-destructive")}
                                                    step="0.1"
                                                />
                                            </TooltipTrigger>
                                            {itemErrors.purchasePrice && <TooltipContent><p>{itemErrors.purchasePrice}</p></TooltipContent>}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => onUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className={cn("text-right", itemErrors.price && "border-destructive focus-visible:ring-destructive")}
                                                    step="0.1"
                                                />
                                            </TooltipTrigger>
                                            {itemErrors.price && <TooltipContent><p>{itemErrors.price}</p></TooltipContent>}
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                             );
                        })}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    );
}
