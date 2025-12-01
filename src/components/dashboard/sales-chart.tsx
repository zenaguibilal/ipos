
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { ChartData } from '@/lib/types';

interface SalesChartProps {
    data: ChartData[];
    dataKey: "revenue" | "profit";
    yAxisLabel: string;
    barFill?: string;
}

export function SalesChart({ data, dataKey, yAxisLabel, barFill }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="date" 
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    stroke="#888888"
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
                    formatter={(value: number) => [value.toFixed(2) + ' DA', yAxisLabel]}
                />
                 <Bar dataKey={dataKey} name={yAxisLabel} fill={barFill || "hsl(var(--primary))"} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

    