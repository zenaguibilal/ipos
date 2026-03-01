'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface RevenueChartProps {
  sales?: Sale[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`Revenu: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-fuchsia-500">{`Bénéfice: ${formatCurrency(payload[1].value)}`}</p>
        </div>
      );
    }
    return null;
  };
  

export default function RevenueChart({ sales, isLoading }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!sales) return [];
    
    const dataByDay: { [key: string]: { revenue: number, profit: number } } = {};

    sales.forEach(sale => {
      const day = format(sale.createdAt!, 'd MMM');
      if (!dataByDay[day]) {
        dataByDay[day] = { revenue: 0, profit: 0 };
      }
      dataByDay[day].revenue += sale.total;
      const saleProfit = sale.items.reduce((acc, item) => {
          const profitPerItem = (item.price - item.purchasePrice) * item.quantity;
          return acc + (isNaN(profitPerItem) ? 0 : profitPerItem);
      }, 0);
      dataByDay[day].profit += saleProfit;
    });

    return Object.entries(dataByDay).map(([date, values]) => ({ date, ...values }));
  }, [sales]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader><CardTitle>Analyse des Revenus</CardTitle><CardDescription>Aperçu des revenus et bénéfices sur la période sélectionnée.</CardDescription></CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des Revenus</CardTitle>
        <CardDescription>Aperçu des revenus et bénéfices sur la période sélectionnée.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {chartData.length > 0 ? (
            <BarChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} DA`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenu" fill="hsl(var(--chart-primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Bénéfice" fill="hsl(var(--chart-quinary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
             <div className="flex h-[350px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Aucune donnée de vente pour cette période.</p>
            </div>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
