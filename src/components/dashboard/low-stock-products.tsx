
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface LowStockProductsProps {
    products: Product[];
}

export function LowStockProducts({ products }: LowStockProductsProps) {
    const router = useRouter();

    return (
        <Card className="bg-card h-full">
            <CardHeader>
                <CardTitle>Produits à faible stock</CardTitle>
                <CardDescription>
                    Ces produits ont atteint ou sont en dessous de leur seuil de stock minimum.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {products.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        Aucun produit en stock faible.
                    </div>
                 ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead className="text-right">Quantité restante</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Stock minimum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium">{product.name}</div>
                                        </TableCell>
                                        <TableCell className={cn("text-right font-bold", product.quantity === 0 ? "text-red-500" : "text-yellow-500")}>
                                            {product.quantity}
                                        </TableCell>
                                        <TableCell className="text-right hidden sm:table-cell">{product.minStockLevel}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
