
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TopProduct } from "@/lib/types";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

interface TopProductsProps {
    products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
    const router = useRouter();

    if (products.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        Produits les plus rentables
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée de vente pour afficher le classement.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                     <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        Produits les plus rentables
                    </CardTitle>
                    <CardDescription>
                        Le top 5 des produits par chiffre d'affaires.
                    </CardDescription>
                </div>
                <Button asChild variant="outline">
                    <Link href="/products">Gérer les produits</Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Unités Vendues</TableHead>
                            <TableHead className="text-right">Chiffre d'Affaires</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                            <TableRow key={product.id} onClick={() => router.push('/products')} className="cursor-pointer">
                                <TableCell>
                                    <div className="font-medium">{product.name}</div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {product.unitsSold}
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">
                                    {product.totalRevenue.toFixed(2)} DA
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
