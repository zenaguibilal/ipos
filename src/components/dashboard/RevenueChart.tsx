'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Sale } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { fr } from 'date-fns/locale';

interface RevenueChartProps {
  sales?: Sale[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-[hsl(var(--chart-primary))]">{`Revenu: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-[hsl(var(--chart-quinary))]">{`Bénéfice: ${formatCurrency(payload[1].value)}`}</p>
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
      const day = format(sale.createdAt!, 'd MMM', { locale: fr });
      if (!dataByDay[day]) {
        dataByDay[day] = { revenue: 0, profit: 0 };
      }
      dataByDay[day].revenue += sale.total;
      
      if(sale.totalProfit !== undefined) {
        dataByDay[day].profit += sale.totalProfit;
      } else {
        // Fallback for old data without pre-calculated profit
        const saleCost = sale.items.reduce((costAcc, item) => {
            const cost = item.purchasePrice * item.quantity;
            return costAcc + (isNaN(cost) ? 0 : cost);
        }, 0);
        dataByDay[day].profit += (sale.total - saleCost);
      }
    });

    return Object.entries(dataByDay).map(([date, values]) => ({ date, ...values }));
  }, [sales]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
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
