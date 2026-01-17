'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TopProduct } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TopProductsProps {
    products: TopProduct[];
}

const COLORS = ['hsl(var(--chart-primary))', 'hsl(var(--chart-secondary))', '#FFBB28', '#FF8042', '#8884d8'];

export function TopProducts({ products }: TopProductsProps) {
    const chartData = products.map(product => ({
        name: product.name,
        value: product.totalProfit,
    }));

    return (
        <Card className="bg-card h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                     <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        Top 5 Produits (Bénéfice)
                    </CardTitle>
                    <CardDescription>
                        Le top 5 des produits par bénéfice net généré sur la période.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                 {products.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée de vente pour afficher le classement.
                    </div>
                ) : (
                    <div>
                         <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `${value.toFixed(2)} DA`}
                                     contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))"
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="overflow-x-auto mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead className="text-right hidden sm:table-cell">Unités Vendues</TableHead>
                                        <TableHead className="text-right">Bénéfice Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(product => (
                                        <TableRow key={product.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="font-medium">{product.name}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium hidden sm:table-cell">
                                                {product.unitsSold}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {product.totalProfit.toFixed(2)} DA
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
