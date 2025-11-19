'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type SalesChartProps = {
    data: { label: string; total: number }[];
}

export function SalesChart({ data = [] }: SalesChartProps) {
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
      <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis
          dataKey="label"
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
