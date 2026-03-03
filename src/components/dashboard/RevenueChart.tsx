
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
        <div className="luxury-glass p-3 rounded-2xl">
          <p className="font-bold text-lg">{label}</p>
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
      
      const saleProfit = sale.items.reduce((profitAcc, item) => {
          const profit = (item.price - item.purchasePrice) * item.quantity;
          return profitAcc + (isNaN(profit) ? 0 : profit);
      }, 0);
      dataByDay[day].profit += saleProfit;
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Analyse des Revenus</CardTitle>
        <CardDescription>Aperçu des revenus et bénéfices sur la période sélectionnée.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {chartData.length > 0 ? (
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
               <defs>
                 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.8}/>
                   <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.2}/>
                 </linearGradient>
                 <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="hsl(var(--chart-quinary))" stopOpacity={0.7}/>
                   <stop offset="95%" stopColor="hsl(var(--chart-quinary))" stopOpacity={0.1}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.1)" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} DA`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.3)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="revenue" name="Revenu" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Bénéfice" fill="url(#colorProfit)" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
             <div className="flex h-[350px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/20">
                <p className="text-muted-foreground">Aucune donnée de vente pour cette période.</p>
            </div>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
