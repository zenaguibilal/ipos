
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { TopCustomer } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TopCustomersProps {
    customers: TopCustomer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
    const router = useRouter();

    const chartData = useMemo(() => {
        return customers
            .map(c => ({
                name: `${c.firstName} ${c.lastName.charAt(0)}.`, // Abbreviate last name
                totalSpent: c.totalSpent,
                id: c.id
            }))
            .sort((a, b) => a.totalSpent - b.totalSpent); // Sort ascending for horizontal bar chart display
    }, [customers]);


    return (
        <Card className="bg-card h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                 <div>
                     <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Top 5 Clients (Dépenses)
                    </CardTitle>
                    <CardDescription>
                        Le top 5 des clients par total dépensé sur la période.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                 {customers.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée client à afficher.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={100}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--accent))' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))"
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                                formatter={(value: number) => [
                                    `${(value as number).toFixed(1)} DA`,
                                    `Total Dépensé`
                                ]}
                            />
                            <Bar 
                                dataKey="totalSpent" 
                                fill="hsl(var(--chart-secondary))" 
                                radius={[0, 4, 4, 0]}
                                onClick={(data: any) => router.push(`/customers/${data.id}`)}
                                className="cursor-pointer"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
