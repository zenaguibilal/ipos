
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

    if (products.length === 0) {
        return null; // Don't render the card if there are no low stock products
    }

    return (
        <Card className="bg-card">
            <CardHeader>
                <CardTitle>Produits à faible stock</CardTitle>
                <CardDescription>
                    Ces produits ont atteint ou sont en dessous de leur seuil de stock minimum.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Quantité restante</TableHead>
                            <TableHead className="text-right">Stock minimum</TableHead>
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
                                <TableCell className="text-right">{product.minStockLevel}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
