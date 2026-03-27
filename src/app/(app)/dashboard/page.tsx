'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
    TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, 
    Archive, RefreshCw, ShieldAlert, Lock, AlertTriangle, ArrowRight,
    ShoppingBag, Package, Plus, Wallet, Zap, Star, Activity
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';

const StatCard = ({ title, value, icon: Icon, change, isLoading, href, positiveIsGood = true, restricted = false }: { title: string, value: string, icon: React.ElementType, change?: number, isLoading: boolean, href?: string, positiveIsGood?: boolean, restricted?: boolean }) => {
    const cardContent = (
        <Card className={cn(
            "h-full luxury-glass border-white/5 bg-muted/10 hover:border-primary/20 transition-all group overflow-hidden relative",
            restricted && "opacity-60 grayscale cursor-not-allowed"
        )}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Icon className="h-24 w-24 rotate-12" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                {restricted ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Icon className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />}
            </CardHeader>
            <CardContent className="relative z-10">
                {restricted ? (
                    <div className="flex items-center gap-2 text-muted-foreground mt-2 py-2">
                        <ShieldAlert className="h-4 w-4 text-primary/40" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Accès Souverain Requis</span>
                    </div>
                ) : (
                    <>
                        {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-black tracking-tight">{value}</div>}
                        {isLoading ? <Skeleton className="h-4 w-40 mt-1" /> : (
                            (change !== undefined && isFinite(change)) ? (
                                <p className="text-[10px] font-bold flex items-center gap-1 mt-1">
                                    <span className={cn(
                                        'px-1.5 py-0.5 rounded-md flex items-center gap-0.5',
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
        return <Link href={href} className="transition-all hover:-translate-y-1 block h-full">{cardContent}</Link>;
    }

    return cardContent;
};

const QuickAction = ({ href, icon: Icon, label, colorClass }: { href: string, icon: any, label: string, colorClass: string }) => (
    <Button asChild variant="outline" className={cn("h-14 justify-start gap-4 rounded-2xl luxury-glass border-white/5 bg-muted/5 group hover:scale-105 transition-all px-6 border-l-4", `border-l-${colorClass.replace('bg-', '')}`)}>
        <Link href={href}>
            <div className={cn("p-2.5 rounded-xl transition-colors shadow-lg", colorClass)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </Link>
    </Button>
);

export default function DashboardPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [data, setData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchData = useCallback(async (from: Date, to: Date) => {
        setIsLoading(true);
        try {
            const query = `from=${from.toISOString()}&to=${to.toISOString()}`;
            const dashboardData = await api.get<any>(`dashboard?${query}`);
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
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 pb-24 md:pb-10 max-w-screen-2xl mx-auto">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <PageHeader 
                        title="Souveraineté Analytique"
                        description="Centre de commandement et d'intelligence stratégique iPOS."
                    />
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto luxury-glass p-2 bg-muted/20 border-white/5">
                        <DateRangePicker date={dateRange} setDate={setDate} />
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => dateRange?.from && dateRange?.to && fetchData(dateRange.from, dateRange.to)}
                            disabled={isLoading}
                            className="luxury-glass border-white/10 h-10 w-10 hover:bg-primary/10"
                        >
                            <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <QuickAction href="/sell" icon={Zap} label="Caisse Live" colorClass="bg-primary" />
                    {isManagerOrAdmin && (
                        <>
                            <QuickAction href="/products" icon={Plus} label="Nouvel Article" colorClass="bg-blue-500" />
                            <QuickAction href="/expenses" icon={TrendingDown} label="Frais & Charges" colorClass="bg-destructive" />
                            <QuickAction href="/stock/intake" icon={Archive} label="Réception Stock" colorClass="bg-orange-500" />
                            <QuickAction href="/suppliers" icon={Wallet} label="Comptes Fournisseurs" colorClass="bg-chart-quaternary" />
                        </>
                    )}
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard 
                    title="Volume Ventes" 
                    value={formatCurrency(data?.stats.totalRevenue ?? 0)} 
                    icon={TrendingUp} 
                    isLoading={isLoading} 
                    href="/sales-history" 
                    change={data?.stats.totalRevenueChange} 
                />
                <StatCard 
                    title="Bénéfice Net" 
                    value={formatCurrency(data?.stats.netProfit ?? 0)} 
                    icon={DollarSign} 
                    isLoading={isLoading} 
                    change={data?.stats.netProfitChange} 
                    restricted={!isManagerOrAdmin} 
                />
                <StatCard 
                    title="Charges & Dépenses" 
                    value={formatCurrency(data?.stats.totalExpenses ?? 0)} 
                    icon={TrendingDown} 
                    isLoading={isLoading} 
                    href="/expenses" 
                    change={data?.stats.totalExpensesChange} 
                    positiveIsGood={false} 
                    restricted={!isManagerOrAdmin} 
                />
                <StatCard 
                    title="Dette Client Globale" 
                    value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} 
                    icon={CreditCard} 
                    isLoading={isLoading} 
                    href="/customers" 
                    restricted={!isManagerOrAdmin} 
                />
                <StatCard 
                    title="Valeur Assets Stock" 
                    value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} 
                    icon={Archive} 
                    isLoading={isLoading} 
                    href="/products" 
                    restricted={!isManagerOrAdmin} 
                />
                <StatCard 
                    title="Transactions" 
                    value={String(data?.stats.saleCount ?? 0)} 
                    icon={Receipt} 
                    isLoading={isLoading} 
                    href="/sales-history" 
                    change={data?.stats.saleCountChange} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="luxury-glass border-white/5 bg-muted/5 overflow-hidden shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                                    Courbe de Performance Flux
                                </CardTitle>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Analyse temporelle des revenus et rentabilité</p>
                            </div>
                            {!isManagerOrAdmin && <Lock className="h-4 w-4 text-muted-foreground opacity-50" />}
                        </CardHeader>
                        <CardContent className="h-[450px] w-full p-8">
                            {!isManagerOrAdmin ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                                    <div className="p-6 bg-primary/10 rounded-full shadow-inner">
                                        <ShieldAlert className="h-16 w-16 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">Détails Analytiques Réservés</p>
                                        <p className="text-xs italic max-w-xs mx-auto">Seuls les profils gestionnaires peuvent visualiser les courbes de flux financiers stratégiques.</p>
                                    </div>
                                </div>
                            ) : isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                                <ResponsiveContainer>
                                    <AreaChart data={data?.salesByDay ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(s) => format(new Date(s), 'd MMM', { locale: fr })} 
                                            tick={{fontSize: 10, fill: 'gray', fontWeight: 'bold'}} 
                                            axisLine={false} 
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `${val}`} 
                                            tick={{fontSize: 10, fill: 'gray', fontWeight: 'bold'}} 
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(26, 18, 12, 0.95)', 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '20px',
                                                backdropFilter: 'blur(15px)',
                                                fontSize: '12px',
                                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                            }} 
                                            formatter={(value: any, name: string) => [
                                                <span className="font-black">{formatCurrency(value)}</span>, 
                                                <span className="uppercase tracking-widest text-[9px] font-bold">{name === 'total' ? 'Chiffre d\'affaires' : 'Bénéfice Brut'}</span>
                                            ]}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="total" 
                                            stroke="hsl(var(--primary))" 
                                            strokeWidth={4}
                                            fill="url(#colorRev)" 
                                            animationDuration={2000}
                                            strokeLinecap="round"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="profit" 
                                            stroke="hsl(var(--chart-quaternary))" 
                                            strokeWidth={3}
                                            fill="url(#colorProfit)" 
                                            animationDuration={2000}
                                            strokeLinecap="round"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <Card className="luxury-glass border-white/5 bg-muted/5 shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-6 py-5">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-chart-secondary flex items-center gap-3">
                                    <Star className="h-4 w-4 animate-spin-slow" />
                                    Performance Elite (Top 5)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                     data?.topProducts.length > 0 ? data.topProducts.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-5 px-8 hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="h-11 w-11 rounded-2xl bg-chart-secondary/10 flex items-center justify-center font-black text-chart-secondary text-lg shadow-inner group-hover:scale-110 transition-transform">
                                                    #{i+1}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase truncate max-w-[140px] tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">{p.quantity} unités écoulées</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-chart-secondary">{formatCurrency(p.revenue)}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-16 text-center text-muted-foreground italic text-xs uppercase font-bold opacity-30">
                                            Aucune donnée de performance.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stock Alerts */}
                        <Card className="luxury-glass border-white/5 bg-muted/5 shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-6 py-5">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-destructive flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    État de Stock Critique
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                     data?.lowStockProducts.length > 0 ? data.lowStockProducts.slice(0, 5).map((p: any) => (
                                        <div key={p.uuid} className="flex items-center justify-between p-5 px-8 hover:bg-destructive/5 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="h-11 w-11 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:rotate-12 transition-all">
                                                    <Package className="h-5 w-5 text-destructive" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm uppercase truncate max-w-[140px] tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">Actuel: <span className="text-destructive font-bold">{p.quantity} {p.unite}</span></p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10 text-[9px] h-6 px-3 font-black uppercase tracking-widest">Achat Requis</Badge>
                                        </div>
                                    )) : (
                                        <div className="p-16 text-center text-muted-foreground italic text-xs uppercase font-bold opacity-30">
                                            Architecture stock stable.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Side Section: Recent Sales */}
                <div className="space-y-8">
                    <Card className="luxury-glass border-white/5 bg-muted/5 h-full flex flex-col min-h-[600px] shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-5">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                <ShoppingBag className="h-4 w-4" />
                                Journal des Opérations Live
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow">
                            <div className="divide-y divide-white/5">
                                {isLoading ? [...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                 data?.recentSales.length > 0 ? data.recentSales.map((s: any) => (
                                    <div key={s.uuid} className="flex items-center justify-between p-5 px-8 hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                                <Receipt className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight truncate max-w-[120px]">
                                                    {s.customerUuid ? 'Facture Client' : 'Passage'}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground font-mono font-bold opacity-60">#{s.invoiceNumber} • {format(new Date(s.createdAt), 'HH:mm')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-primary">{formatCurrency(s.total)}</p>
                                            <Badge className={cn(
                                                "h-4 text-[8px] font-black uppercase border-0 px-2 rounded-lg mt-1",
                                                s.paymentStatus === 'paid' ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
                                            )}>
                                                {s.paymentStatus === 'paid' ? 'Réglée' : 'Impayée'}
                                            </Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-32 text-center text-muted-foreground italic text-xs uppercase font-bold opacity-30">
                                        Aucun flux détecté.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <div className="p-6 border-t border-white/5 bg-white/5">
                            <Button variant="ghost" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] group hover:bg-primary/10 hover:text-primary transition-all" asChild>
                                <Link href="/sales-history">
                                    Accéder au Grand Livre
                                    <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
