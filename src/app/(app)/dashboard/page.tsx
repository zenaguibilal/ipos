'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData } from '@/lib/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Archive, RefreshCw, ShieldAlert, Lock } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIsManagerOrAdmin } from '@/stores/appStore';

const StatCard = ({ title, value, icon: Icon, change, isLoading, href, positiveIsGood = true, restricted = false }: { title: string, value: string, icon: React.ElementType, change?: number, isLoading: boolean, href?: string, positiveIsGood?: boolean, restricted?: boolean }) => {
    const cardContent = (
        <Card className={cn(
            "h-full luxury-glass border-white/5 bg-muted/10 hover:border-primary/20 transition-all",
            restricted && "opacity-50 grayscale cursor-not-allowed"
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                {restricted ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Icon className="h-4 w-4 text-primary opacity-50" />}
            </CardHeader>
            <CardContent>
                {restricted ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs font-bold uppercase tracking-widest italic">Accès Restreint</span>
                    </div>
                ) : (
                    <>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-black">{value}</div>}
                        {isLoading ? <Skeleton className="h-4 w-40 mt-1" /> : (
                            (change !== undefined && isFinite(change)) ? (
                                <p className="text-[10px] font-bold flex items-center gap-1 mt-1">
                                    <span className={cn(
                                        'px-1.5 py-0.5 rounded-md',
                                        (positiveIsGood && change >= 0) || (!positiveIsGood && change < 0) ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
                                    )}>
                                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                                    </span>
                                    <span className="text-muted-foreground uppercase opacity-60">vs. période précédente</span>
                                </p>
                            ) : <div className="h-[18px]"></div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );

    if (href && !restricted) {
        return <Link href={href} className="transition-all hover:-translate-y-1 block">{cardContent}</Link>;
    }

    return cardContent;
};

export default function DashboardPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async (from: Date, to: Date) => {
        setIsLoading(true);
        try {
            const query = `from=${from.toISOString()}&to=${to.toISOString()}`;
            const dashboardData = await api.get<DashboardData>(`dashboard?${query}`);
            setData(dashboardData);
        } catch (error: any) {
            toast.error("Échec de l'agrégation des données.");
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
                title="Souveraineté Analytique"
                description="Vue d'ensemble temps réel de votre écosystème commercial."
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => dateRange?.from && dateRange?.to && fetchData(dateRange.from, dateRange.to)}
                    disabled={isLoading}
                    className="luxury-glass border-white/10"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </PageHeader>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Volume Ventes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/sales-history" change={data?.stats.totalRevenueChange} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={DollarSign} isLoading={isLoading} change={data?.stats.netProfitChange} restricted={!isManagerOrAdmin} />
                <StatCard title="Charges & Dépenses" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingDown} isLoading={isLoading} href="/expenses" change={data?.stats.totalExpensesChange} positiveIsGood={false} restricted={!isManagerOrAdmin} />
                <StatCard title="Dette Client" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers" restricted={!isManagerOrAdmin} />
                <StatCard title="Valeur Assets Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" restricted={!isManagerOrAdmin} />
                <StatCard title="Transactions" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} href="/sales-history" change={data?.stats.saleCountChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="luxury-glass border-white/5 bg-muted/5">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Courbe de Performance</CardTitle>
                            {!isManagerOrAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent className="h-80 w-full p-2">
                            {!isManagerOrAdmin ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                                    <ShieldAlert className="h-12 w-12 text-muted-foreground" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Détails de marge réservés à la gestion</p>
                                </div>
                            ) : isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                                <ResponsiveContainer>
                                    <AreaChart data={data?.salesByDay ?? []}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tickFormatter={(s) => format(new Date(s), 'd MMM', { locale: fr })} tick={{fontSize: 10, fill: 'gray'}} axisLine={false} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a120c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="luxury-glass border-white/5 bg-muted/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Dernières Opérations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />) : (
                                data?.recentSales.map(s => (
                                    <div key={s.uuid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all">
                                        <div>
                                            <p className="text-xs font-bold uppercase truncate max-w-[120px]">{s.customerUuid ? 'Client Fidèle' : 'Passage'}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">#{s.invoiceNumber}</p>
                                        </div>
                                        <p className="text-sm font-black text-primary">{formatCurrency(s.total)}</p>
                                    </div>
                                ))
                            )}
                            {data?.recentSales.length === 0 && <p className="text-center py-10 text-xs text-muted-foreground italic">Aucune vente enregistrée.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
