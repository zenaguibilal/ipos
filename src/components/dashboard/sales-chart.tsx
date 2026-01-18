
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartData } from '@/lib/types';

interface SalesChartProps {
    data: ChartData[];
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} DA`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number, name) => {
                        const label = name === 'revenue' ? 'Chiffre d\'affaires' : 'Bénéfice net';
                        return [value.toFixed(1) + ' DA', label];
                    }}
                />
                 <Legend />
                 <Bar dataKey="revenue" name="Chiffre d'affaires" fill="hsl(var(--chart-primary))" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="profit" name="Bénéfice net" fill="hsl(var(--chart-secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
