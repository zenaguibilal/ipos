
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon, BookOpen, CheckCircle2, Zap } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface ZakatChartsProps {
    result: any;
    zakatData: any;
}

export function ZakatCharts({ result, zakatData }: ZakatChartsProps) {
    const chartData = useMemo(() => {
        if (!result) return [];
        return [
            { name: 'Stocks', value: result.inventoryValue, color: 'hsl(var(--primary))' },
            { name: 'Créances', value: result.customerDebts, color: '#10b981' },
            { name: 'Liquidités', value: result.cashOnHand, color: '#3b82f6' },
        ].filter(item => item.value > 0);
    }, [result]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl">
                <CardHeader className="bg-white/5 border-b border-white/5 py-6 px-8">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <PieChartIcon className="h-5 w-5 text-primary" />
                        Analyse de Composition
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-80 w-full pt-8">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value">
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(26, 18, 12, 0.95)', borderRadius: '15px' }} formatter={(val: number) => formatCurrency(val)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center opacity-20">Aucune donnée</div>}
                </CardContent>
            </Card>
            
            <div className="p-8 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center space-y-8 shadow-inner">
                <div className="p-5 bg-emerald-500/10 rounded-3xl"><BookOpen className="h-10 w-10 text-emerald-500" /></div>
                <div className="space-y-4">
                    <p className="text-sm font-black uppercase tracking-tight italic">Directives de Souveraineté</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md uppercase font-bold opacity-70">
                        Le calcul déterministe soustrait vos passifs de vos actifs circulants. 
                        Valeur Or Actuelle : <span className="font-black text-emerald-500">{formatCurrency(zakatData.goldPrice)}/g</span>.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    <Badge variant="outline" className="h-10 px-6 rounded-xl border-emerald-500/20 text-emerald-500 font-black uppercase text-[9px] tracking-widest bg-background/40">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Audit iPOS Certifié
                    </Badge>
                    <Badge variant="outline" className="h-10 px-6 rounded-xl border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest bg-background/40">
                        <Zap className="h-3.5 w-3.5 mr-2" /> Calcul Live Instantané
                    </Badge>
                </div>
            </div>
        </div>
    );
}
