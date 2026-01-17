
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Warehouse } from "lucide-react";
import type { InventoryValueData } from "@/lib/types";

interface InventoryValueChartProps {
    data: InventoryValueData[];
}

const COLORS = ['hsl(var(--chart-primary))', 'hsl(var(--chart-secondary))', '#FFBB28', '#FF8042', '#8884d8', '#dddddd'];

export function InventoryValueChart({ data }: InventoryValueChartProps) {
    return (
        <Card className="bg-card h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-muted-foreground" />
                    Répartition de la Valeur du Stock
                </CardTitle>
                <CardDescription>
                    Distribution de la valeur d'achat de votre inventaire.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {data.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        Aucun produit en stock pour afficher la répartition.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {data.map((entry, index) => (
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
                )}
            </CardContent>
        </Card>
    );
}
