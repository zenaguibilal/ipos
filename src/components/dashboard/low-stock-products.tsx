
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

interface LowStockProductsProps {
    products: Product[];
}

export function LowStockProducts({ products }: LowStockProductsProps) {
    const router = useRouter();

    return (
        <Card className="bg-card h-full flex flex-col">
            <CardHeader>
                <CardTitle>Produits à faible stock</CardTitle>
                <CardDescription>
                    Ces produits ont atteint ou sont en dessous de leur seuil de stock minimum.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
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
                                    <TableRow key={product.id}>
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
            {products.length > 0 && (
                <CardFooter>
                    <Button
                        onClick={() => router.push('/products')}
                        variant="outline"
                        className="w-full"
                    >
                        Aller aux produits
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
