
'use client';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from 'next-themes';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardChartData } from '@/lib/types';
import { useState } from 'react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl border bg-background/80 backdrop-blur-sm">
        <p className="font-bold text-lg">{label}</p>
        <p className="text-primary">{`Revenu: ${formatCurrency(payload[0].value)}`}</p>
        <p className="text-success">{`Bénéfice: ${formatCurrency(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data }: { data: DashboardChartData[] }) {
    const { theme } = useTheme();
    const cardClass = theme === 'light' ? 'glass-card-light' : 'glass-card-dark';
    const [timeframe, setTimeframe] = useState('day');

    return (
        <div className={cn('glass-card h-96 flex flex-col p-6', cardClass)}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Revenus & Bénéfices</h3>
                <Select value={timeframe} onValueChange={setTimeframe} disabled>
                    <SelectTrigger className="w-[120px] h-9 bg-card/50">
                        <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Jour</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground) / 0.1)" />
                        <XAxis 
                            dataKey="jour" 
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
                            tickFormatter={(value) => `${Number(value) / 1000}k`} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="revenu" name="Revenu" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="benefice" name="Bénéfice" fill="url(#colorProfit)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
