
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
    TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, 
    Archive, RefreshCw, ShieldCheck, Lock, AlertTriangle, ArrowRight,
    ShoppingBag, Package, Plus, Wallet, Zap, Star, Activity,
    Target, LayoutDashboard, HandCoins, BarChart3, TrendingUpDown, ShieldX
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
                        <ShieldCheck className="h-4 w-4 text-primary/40" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Accès Souverain</span>
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
                                    <span className="text-muted-foreground uppercase font-black opacity-60">vs. précédent</span>
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
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile } = useAppStore();
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [data, setData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAllowed = profile?.permissions?.includes('dashboard') || isManagerOrAdmin;

    // Access Guard
    useEffect(() => {
        if (profile && !isAllowed) {
            toast.error("Unité Dashboard Restreinte", { 
                description: "Vous n'avez pas l'autorisation de consulter les statistiques globales.",
                icon: <ShieldX className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isAllowed, router]);
    
    const fetchData = useCallback(async (from: Date, to: Date) => {
        if (!isAllowed) return;
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
    }, [isAllowed]);

    useEffect(() => {
        if (isMounted && dateRange?.from && dateRange?.to && isAllowed) {
            fetchData(dateRange.from, dateRange.to);
        }
    }, [dateRange, isMounted, fetchData, isAllowed]);

    if (!profile || !isAllowed) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
                <div className="p-6 bg-destructive/5 rounded-[3rem] border border-destructive/10 shadow-2xl relative overflow-hidden group">
                    <Lock className="h-16 w-16 text-destructive animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-destructive/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint au Dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 pb-24 md:pb-10 max-w-screen-2xl mx-auto">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <PageHeader 
                        title="Commandement Analytique"
                        description="Synthèse stratégique et performance globale de l'instance."
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 luxury-glass border-white/5 bg-gradient-to-br from-primary/10 via-transparent to-transparent overflow-hidden group">
                        <div className="p-8 flex flex-col md:flex-row items-center gap-8 relative">
                            <div className="relative h-32 w-32 shrink-0">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                <div className="h-full w-full rounded-full border-4 border-white/5 flex items-center justify-center relative z-10 bg-background/40 backdrop-blur-xl">
                                    <div className="text-center">
                                        <p className="text-4xl font-black text-primary leading-none">{isLoading ? '...' : data?.stats.healthScore}%</p>
                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mt-1">Sovereign Score</p>
                                    </div>
                                </div>
                                <svg className="absolute top-0 left-0 h-full w-full -rotate-90 pointer-events-none">
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                    <circle
                                        cx="64" cy="64" r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="377"
                                        strokeDashoffset={377 - (377 * (data?.stats.healthScore || 0)) / 100}
                                        className="text-primary transition-all duration-1000 ease-out"
                                    />
                                </svg>
                            </div>
                            <div className="space-y-4 text-center md:text-left">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Diagnostic de <span className="text-primary">Performance</span></h3>
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">Verdict du Système Core iPOS</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                                    <p className="text-sm font-bold text-foreground">
                                        {isLoading ? 'Analyse des flux en cours...' : data?.stats.insight}
                                    </p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all pointer-events-none">
                                <Target className="h-48 w-48 rotate-12" />
                            </div>
                        </div>
                    </Card>
                    <div className="grid gap-4">
                        <QuickAction href="/sell" icon={Zap} label="Terminal Vente" colorClass="bg-primary" />
                        {isManagerOrAdmin && <QuickAction href="/stock/intake" icon={Archive} label="Réception Stock" colorClass="bg-orange-500" />}
                    </div>
                </div>
            </div>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard title="Volume Ventes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/sales-history" change={data?.stats.totalRevenueChange} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={DollarSign} isLoading={isLoading} change={data?.stats.netProfitChange} restricted={!isManagerOrAdmin} />
                <StatCard title="Charges Globales" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingDown} isLoading={isLoading} href="/expenses" change={data?.stats.totalExpensesChange} positiveIsGood={false} restricted={!isManagerOrAdmin} />
                <StatCard title="Encours Clients" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers" restricted={!isManagerOrAdmin} />
                <StatCard title="Valorisation Stock" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" restricted={!isManagerOrAdmin} />
                <StatCard title="Transactions" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} href="/sales-history" change={data?.stats.saleCountChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="luxury-glass border-white/5 bg-muted/5 overflow-hidden shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                                    Courbe Stratégique des Flux
                                </CardTitle>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Analyse temporelle du rendement</p>
                            </div>
                            {!isManagerOrAdmin && <Lock className="h-4 w-4 text-muted-foreground opacity-50" />}
                        </CardHeader>
                        <CardContent className="h-[450px] w-full p-8">
                            {!isManagerOrAdmin ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                                    <ShieldCheck className="h-16 w-16 text-primary" />
                                    <p className="text-sm font-black uppercase tracking-[0.2em]">Analyse Visuelle Restreinte</p>
                                </div>
                            ) : isLoading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                                <ResponsiveContainer>
                                    <AreaChart data={data?.salesByDay ?? []}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tickFormatter={(s) => format(new Date(s), 'd MMM', { locale: fr })} tick={{fontSize: 10, fill: 'gray'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 10, fill: 'gray'}} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a120c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }} />
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="luxury-glass border-white/5 bg-muted/5 shadow-xl">
                            <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-5">
                                <CardTitle className="text-[11px] font-black uppercase text-chart-secondary flex items-center gap-3">
                                    <Star className="h-4 w-4 text-chart-secondary" />
                                    Elite Performance (Top 5)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                     data?.topProducts.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-5 px-8 hover:bg-white/5 transition-all">
                                            <p className="font-black text-xs uppercase truncate max-w-[140px]">{p.name}</p>
                                            <p className="text-sm font-black text-chart-secondary">{formatCurrency(p.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="luxury-glass border-white/5 bg-muted/5 shadow-xl">
                            <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-5">
                                <CardTitle className="text-[11px] font-black uppercase text-destructive flex items-center gap-3">
                                    <AlertTriangle className="h-4 w-4" />
                                    Stock Critique
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {isLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                     data?.lowStockProducts.slice(0, 5).map((p: any) => (
                                        <div key={p.uuid} className="flex items-center justify-between p-5 px-8 hover:bg-destructive/5 transition-all">
                                            <p className="font-black text-xs uppercase truncate max-w-[140px]">{p.name}</p>
                                            <Badge variant="destructive" className="text-[8px] font-black">{p.quantity} {p.unite}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-8">
                    <Card className="luxury-glass border-white/5 bg-muted/5 h-full flex flex-col min-h-[600px] shadow-2xl">
                        <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-5">
                            <CardTitle className="text-[11px] font-black uppercase text-primary flex items-center gap-3">
                                <ShoppingBag className="h-4 w-4" />
                                Journal Live
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow">
                            <div className="divide-y divide-white/5">
                                {isLoading ? [...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />) : 
                                 data?.recentSales.map((s: any) => (
                                    <div key={s.uuid} className="flex items-center justify-between p-5 px-8 hover:bg-white/5 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black uppercase">{s.customerUuid ? 'Client iPOS' : 'Passage'}</p>
                                            <p className="text-[8px] font-mono opacity-40">#{s.invoiceNumber}</p>
                                        </div>
                                        <p className="text-sm font-black text-primary">{formatCurrency(s.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <div className="p-6 border-t border-white/5 bg-white/5 text-center">
                            <Button variant="ghost" asChild className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all">
                                <Link href="/sales-history">Voir tout le journal <ArrowRight className="ml-2 h-3 w-3" /></Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
