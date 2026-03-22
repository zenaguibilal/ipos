'use client';
import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { DashboardExpenseData } from '@/lib/types';
import { Wallet } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl border bg-background/80 backdrop-blur-sm">
        <p className="font-bold">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

export function ExpensesPieChart({ data }: { data: DashboardExpenseData[] }) {
    const cardClass = 'luxury-glass';

    const totalExpenses = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    const COLORS = [
        'hsl(var(--chart-primary))',
        'hsl(var(--chart-secondary))',
        'hsl(var(--chart-tertiary))',
        'hsl(var(--chart-quaternary))',
        'hsl(var(--chart-quinary))',
        '#82ca9d',
    ];

    return (
        <div className={cn('h-full flex flex-col p-6', cardClass)}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold">Analyse des Dépenses</h3>
                    <p className="text-muted-foreground">Total: <span className="font-bold text-destructive">{formatCurrency(totalExpenses)}</span></p>
                </div>
                 <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            {data.length > 0 ? (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            fill="hsl(var(--primary))"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pr-4">
                       <ul className="text-sm space-y-2 max-h-52 overflow-y-auto">
                          {data.map((entry: any, index: number) => (
                              <li key={`item-${index}`} className="flex items-center gap-2">
                                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  <span className="text-muted-foreground">{entry.name}</span>
                                  <span className="font-semibold ml-auto">{formatCurrency(entry.value)}</span>
                              </li>
                          ))}
                      </ul>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">Aucune dépense pour cette période.</p>
                </div>
            )}
        </div>
    );
}
