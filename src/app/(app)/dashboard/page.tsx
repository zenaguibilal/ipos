'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData, RecentSale, RecentReturn, SalesByDay } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, Undo2 } from 'lucide-react';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string, icon: React.ElementType, description?: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const SalesChart = ({ data, isLoading }: { data: SalesByDay[], isLoading: boolean }) => (
    <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
            <CardTitle>Aperçu des Ventes</CardTitle>
            <CardDescription>Evolution du chiffre d'affaires sur la période sélectionnée.</CardDescription>
        </CardHeader>
        <CardContent className="h-80 w-full p-2">
             {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'd MMM', { locale: fr })}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        tickFormatter={(val) => `${val / 1000}k`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
            </ResponsiveContainer>
             )}
        </CardContent>
    </Card>
);

const RecentActivity = ({ sales, returns, isLoading }: { sales: RecentSale[], returns: RecentReturn[], isLoading: boolean }) => (
    <Card className="col-span-1">
        <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {isLoading ? (
                <div className="flex justify-center items-center h-full min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Receipt className="h-4 w-4"/> Ventes Récentes</h3>
                    <div className="space-y-2">
                        {sales.length > 0 ? sales.map(s => (
                            <Link href={`/sales-history`} key={s.uuid} className="block p-2 rounded-md hover:bg-accent">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium truncate">{s.customerName}</span>
                                    <span className="font-bold text-primary">{formatCurrency(s.total)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{format(safeToDate(s.createdAt!), 'd MMM, HH:mm', { locale: fr })} - #{s.invoiceNumber}</p>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground text-center">Aucune vente récente.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Undo2 className="h-4 w-4"/> Retours Récents</h3>
                    <div className="space-y-2">
                        {returns.length > 0 ? returns.map(r => (
                             <Link href={`/returns`} key={r.uuid} className="block p-2 rounded-md hover:bg-accent">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium truncate">{r.customerName}</span>
                                    <span className="font-bold text-destructive">-{formatCurrency(r.totalReturnValue)}</span>
                                </div>
                                 <p className="text-xs text-muted-foreground">{format(safeToDate(r.createdAt!), 'd MMM, HH:mm', { locale: fr })} - Facture #{r.originalInvoiceNumber}</p>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground text-center">Aucun retour récent.</p>}
                    </div>
                </div>
                </>
             )}
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async (from: Date, to: Date) => {
        setIsLoading(true);
        try {
            const dashboardData = await dashboardService.getDashboardData(from, to);
            setData(dashboardData);
        } catch (error: any) {
            toast.error("Impossible de charger les données du tableau de bord.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isMounted && dateRange?.from && dateRange?.to) {
            fetchData(dateRange.from, dateRange.to);
        }
    }, [dateRange, isMounted, fetchData]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Tableau de Bord"
                description="Vue d'ensemble de l'activité de votre commerce."
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
            </PageHeader>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total des Ventes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} />
                <StatCard title="Total des Dépenses" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingDown} isLoading={isLoading} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={DollarSign} isLoading={isLoading} />
                <StatCard title="Nombre de Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
            </div>
        </div>
    );
}
