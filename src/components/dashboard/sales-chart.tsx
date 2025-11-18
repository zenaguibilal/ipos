'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const data = [
  { month: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Fév', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Avr', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Mai', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Juin', total: Math.floor(Math.random() * 5000) + 1000 },
];

export function SalesChart() {
  return (
    <ChartContainer
      config={{
        total: {
          label: 'Ventes',
          color: 'hsl(var(--chart-1))',
        },
      }}
      className="h-[250px] w-full"
    >
      <BarChart accessibilityLayer data={data}>
        <XAxis
          dataKey="month"
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
          tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" formatter={(value, name) => [(value as number).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }), name]} />}
        />
        <Bar
          dataKey="total"
          fill="var(--color-total)"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ChartContainer>
  );
}
