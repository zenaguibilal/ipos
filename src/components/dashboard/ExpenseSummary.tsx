
'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface ExpenseSummaryProps {
  expenses?: Expense[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--chart-primary))',
  'hsl(var(--chart-secondary))',
  'hsl(var(--chart-tertiary))',
  'hsl(var(--chart-quaternary))',
  'hsl(var(--chart-quinary))',
  'hsl(220, 80%, 70%)',
  'hsl(180, 70%, 60%)',
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="luxury-glass p-3 rounded-2xl">
          <p className="font-bold">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <ul className="text-xs space-y-1">
            {payload.map((entry: any, index: number) => (
                <li key={`item-${index}`} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.value}:</span>
                    <span className="font-semibold ml-auto">{formatCurrency(entry.payload.value)}</span>
                </li>
            ))}
        </ul>
    );
};


export default function ExpenseSummary({ expenses, isLoading }: ExpenseSummaryProps) {
  const { dataByCategory, totalExpenses } = useMemo(() => {
    if (!expenses) return { dataByCategory: [], totalExpenses: 0 };
    
    const categoryMap: { [key: string]: number } = {};
    let total = 0;

    expenses.forEach(expense => {
      total += expense.amount;
      categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
    });

    const data = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    return { dataByCategory: data, totalExpenses: total };
  }, [expenses]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Analyse des Dépenses</CardTitle>
        <CardDescription>
            Total : <span className="font-bold text-destructive">{formatCurrency(totalExpenses)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {dataByCategory.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 w-full h-full items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                  >
                    {dataByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ScrollArea className="h-[150px]">
                <Legend content={renderLegend} payload={dataByCategory.map((entry, index) => ({
                    value: entry.name,
                    type: 'circle',
                    id: entry.name,
                    color: COLORS[index % COLORS.length],
                    payload: entry,
                }))}/>
              </ScrollArea>
          </div>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-primary/20">
                <p className="text-muted-foreground">Aucune dépense dans cette période.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
