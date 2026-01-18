
'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DebtChartData {
  date: string;
  totalDebt: number;
}

interface TotalDebtChartProps {
    data: DebtChartData[];
}

export function TotalDebtChart({ data }: TotalDebtChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
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
                        const label = name === 'totalDebt' ? 'Dette Totale' : 'Inconnu';
                        return [value.toFixed(1) + ' DA', label];
                    }}
                />
                 <Area 
                    type="monotone" 
                    dataKey="totalDebt" 
                    name="Dette Totale" 
                    stroke="hsl(var(--destructive))" 
                    fillOpacity={1} 
                    fill="url(#colorDebt)" 
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
