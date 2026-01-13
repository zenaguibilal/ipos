
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Archive, Warehouse } from "lucide-react";
import Link from "next/link";

interface LowStockAlertsProps {
    products: Product[];
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
    const router = useRouter();

    if (products.length === 0) {
        return null; // Don't render the card if there are no low stock products
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-yellow-500" />
                        Alertes de stock faible ({products.length})
                    </CardTitle>
                    <CardDescription>
                        Ces produits ont atteint ou sont en dessous de leur seuil de stock minimum.
                    </CardDescription>
                </div>
                 <div className="flex gap-2">
                     <Button asChild variant="default" size="sm">
                        <Link href="/products/purchase-orders">
                             <Warehouse className="mr-2 h-4 w-4" />
                            Créer un bon de commande
                        </Link>
                    </Button>
                </div>
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
                            <TableRow key={product.id} className="cursor-pointer hover:bg-muted">
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
