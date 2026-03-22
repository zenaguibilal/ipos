'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, TooltipProps } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Sale } from '@/lib/types';
import { useMemo } from 'react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.7rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-muted-foreground">
              Revenu
            </span>
            <span className="font-bold">
              Profit
            </span>
          </div>
          <div className="flex flex-col space-y-1">
             <span className="font-bold">
              <br/>
            </span>
            <span className="font-bold text-right">
              {formatCurrency(payload[0].value!)}
            </span>
            <span className="font-bold text-right text-primary">
              {formatCurrency(payload[1].value!)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function RevenueChart({ sales }: { sales: Sale[] }) {
    
    const chartData = useMemo(() => {
        if (sales.length === 0) return [];
        
        const sortedSales = sales.sort((a,b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
        const firstSaleDate = new Date(sortedSales[0].createdAt!);
        const lastSaleDate = new Date(sortedSales[sortedSales.length - 1].createdAt!);
        const interval = eachDayOfInterval({ start: firstSaleDate, end: lastSaleDate });
        
        const dailyData = new Map<string, { revenue: number, profit: number }>();
        interval.forEach(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            dailyData.set(dayString, { revenue: 0, profit: 0 });
        });

        for (const sale of sales) {
            const day = format(new Date(sale.createdAt!), 'yyyy-MM-dd');
            const data = dailyData.get(day);
            if (data) {
                const profit = sale.items.reduce((acc, item) => acc + (item.price - item.purchasePrice) * item.quantity, 0);
                data.revenue += sale.total;
                data.profit += profit;
            }
        }
        
        return Array.from(dailyData.entries()).map(([date, { revenue, profit }]) => ({
            date: format(parseISO(date), 'd MMM', { locale: fr }),
            revenue,
            profit,
        }));

    }, [sales]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenu & Profit</CardTitle>
                <CardDescription>Analyse des revenus et profits sur la période sélectionnée.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ResponsiveContainer width="100%" height={350}>
                     <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
                        <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Revenu"/>
                        <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Profit"/>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
