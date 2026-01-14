
'use client';

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartData } from '@/lib/types';

interface SalesAndDebtsChartProps {
    data: ChartData[];
}

export function SalesAndDebtsChart({ data }: SalesAndDebtsChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
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
                        let label = '';
                        if (name === 'newDebt') label = 'Nouvelles Dettes';
                        if (name === 'payments') label = 'Paiements Reçus';
                        return [value.toFixed(2) + ' DA', label];
                    }}
                />
                 <Legend />
                 <Line type="monotone" dataKey="newDebt" name="Nouvelles Dettes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                 <Line type="monotone" dataKey="payments" name="Paiements Reçus" stroke="hsl(var(--chart-secondary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}
