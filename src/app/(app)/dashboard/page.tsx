
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData, RecentSale, RecentReturn, SalesByDay, TopProduct, TopCustomer, LowStockProduct } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Undo2, Users, CreditCard, Archive, RefreshCw } from 'lucide-react';
import { formatCurrency, safeToDate, getPlaceholder, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const StatCard = ({ title, value, icon: Icon, change, isLoading, href, positiveIsGood = true }: { title: string, value: string, icon: React.ElementType, change?: number, isLoading: boolean, href?: string, positiveIsGood?: boolean }) => {
    const cardContent = (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
                {isLoading ? <Skeleton className="h-4 w-40 mt-1" /> : (
                    (change !== undefined && isFinite(change)) ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={cn(
                                'font-semibold',
                                (positiveIsGood && change >= 0) || (!positiveIsGood && change < 0) ? 'text-green-500' : 'text-destructive'
                            )}>
                                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                            </span>
                            <span>vs. période précédente</span>
                        </p>
                    ) : <div className="h-[18px]"></div> /* Placeholder to prevent layout shift */
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="transition-all hover:-translate-y-1 block">{cardContent}</Link>;
    }

    return cardContent;
};

const SalesChart = ({ data, isLoading }: { data: SalesByDay[], isLoading: boolean }) => (
    <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle>Aperçu Financier</CardTitle>
            <CardDescription>Évolution du chiffre d'affaires et du bénéfice brut sur la période.</CardDescription>
        </CardHeader>
        <CardContent className="h-80 w-full p-2">
             {isLoading ? (
                <div className="h-full w-full p-2">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-primary))" stopOpacity={0}/>
                        </linearGradient>
                         <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0.7}/>
                            <stop offset="95%" stopColor="hsl(var(--chart-quaternary))" stopOpacity={0}/>
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
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'total' ? "Chiffre d'affaires" : 'Bénéfice brut']}
                    />
                    <Area type="monotone" dataKey="total" name="Chiffre d'affaires" stroke="hsl(var(--chart-primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" name="Bénéfice brut" stroke="hsl(var(--chart-quaternary))" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
             )}
        </CardContent>
    </Card>
);

const RecentActivity = ({ sales, returns, isLoading }: { sales: RecentSale[], returns: RecentReturn[], isLoading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Dernières ventes et retours enregistrés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-80 overflow-y-auto">
             {isLoading ? (
                <div className="space-y-6">
                    <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <div className="space-y-2">
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <div className="space-y-2">
                            <Skeleton className="h-14 w-full" />
                        </div>
                    </div>
                </div>
            ) : (
                <>
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Receipt className="h-4 w-4"/> Ventes Récentes</h3>
                    <div className="space-y-2">
                        {sales.length > 0 ? sales.map(s => (
                            <Link href={`/sales-history?query=${s.invoiceNumber}`} key={s.uuid} className="block p-2 rounded-md hover:bg-accent">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium truncate">{s.customerName}</span>
                                    <span className="font-bold text-primary">{formatCurrency(s.total)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{format(safeToDate(s.createdAt!), 'd MMM, HH:mm', { locale: fr })} - #{s.invoiceNumber}</p>
                            </Link>
                        )) : <p className="text-sm text-muted-foreground text-center">Aucune vente récente.</p>}
                    </div>
                </div>
                 <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Undo2 className="h-4 w-4"/> Retours Récents</h3>
                    <div className="space-y-2">
                        {returns.length > 0 ? returns.map(r => (
                             <Link href={`/returns?query=${r.originalInvoiceNumber}`} key={r.uuid} className="block p-2 rounded-md hover:bg-accent">
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

const TopProductsCard = ({ products, isLoading }: { products: TopProduct[], isLoading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle>Top Produits</CardTitle>
            <CardDescription>Produits les plus rentables sur la période.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée de produit disponible.</p>
            ) : (
                <div className="space-y-4">
                    {products.map((p, index) => (
                        <div key={p.productUuid} className="flex items-center gap-4">
                            <span className="font-bold text-lg text-muted-foreground w-6 text-center">{index + 1}</span>
                            <Image 
                                src={p.imageUrl || getPlaceholder(p.category).url} 
                                alt={p.name}
                                width={40} height={40}
                                className="rounded-md h-10 w-10 object-cover"
                                data-ai-hint={getPlaceholder(p.category).hint}
                            />
                            <div className="flex-grow">
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-sm text-muted-foreground">{p.quantitySold} vendus</p>
                            </div>
                            <div className="font-bold text-lg text-primary">{formatCurrency(p.revenueGenerated)}</div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
         <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/products">Voir tous les produits</Link>
            </Button>
        </CardFooter>
    </Card>
);

const TopCustomersCard = ({ customers, isLoading }: { customers: TopCustomer[], isLoading: boolean }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Clients les plus dépensiers sur la période.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée de client.</p>
            ) : (
                <div className="space-y-4">
                    {customers.map((c, index) => (
                        <div key={c.customerUuid} className="flex items-center gap-4">
                            <span className="font-bold text-lg text-muted-foreground w-6 text-center">{index + 1}</span>
                             <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground font-bold">
                                {c.name.substring(0, 1)}
                            </div>
                            <div className="flex-grow">
                                <Link href={`/customers/${c.customerUuid}`} className="font-semibold hover:underline">{c.name}</Link>
                            </div>
                            <div className="font-bold text-lg text-primary">{formatCurrency(c.totalSpent)}</div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
         <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/customers">Voir tous les clients</Link>
            </Button>
        </CardFooter>
    </Card>
);


const LowStockProductsCard = ({ products, isLoading }: { products: LowStockProduct[], isLoading: boolean }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle>Alertes de Stock Faible</CardTitle>
            <CardDescription>Produits qui ont besoin d'être réapprovisionnés.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun produit en stock faible.</p>
            ) : (
                <div className="space-y-4">
                    {products.map(p => (
                        <div key={p.uuid}>
                           <Link href={`/products?query=${p.name}`} className="block hover:bg-accent p-2 rounded-md">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="font-mono font-bold text-chart-secondary">{p.quantity} / {p.minStockLevel} {p.unite}</p>
                                </div>
                                <Progress value={(p.quantity / p.minStockLevel) * 100} className="h-2 mt-1" />
                           </Link>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
         <CardFooter>
            <Button asChild variant="outline" className="w-full">
                <Link href="/products?stockStatus=low_stock">Voir tous les produits en stock faible</Link>
            </Button>
        </CardFooter>
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

            const intervalId = setInterval(() => {
                fetchData(dateRange.from!, dateRange.to!);
            }, 60000); // Rafraîchir toutes les 60 secondes

            return () => clearInterval(intervalId); // Nettoyer l'intervalle
        }
    }, [dateRange, isMounted, fetchData]);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Tableau de Bord"
                description="Vue d'ensemble de l'activité de votre commerce."
            >
                <DateRangePicker date={dateRange} setDate={setDate} />
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => dateRange?.from && dateRange?.to && fetchData(dateRange.from, dateRange.to)}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </PageHeader>
            
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total des Ventes" value={formatCurrency(data?.stats.totalRevenue ?? 0)} icon={TrendingUp} isLoading={isLoading} href="/sales-history" change={data?.stats.totalRevenueChange} />
                <StatCard title="Bénéfice Net" value={formatCurrency(data?.stats.netProfit ?? 0)} icon={DollarSign} isLoading={isLoading} change={data?.stats.netProfitChange} />
                <StatCard title="Total des Dépenses" value={formatCurrency(data?.stats.totalExpenses ?? 0)} icon={TrendingDown} isLoading={isLoading} href="/expenses" change={data?.stats.totalExpensesChange} positiveIsGood={false} />
                <StatCard title="Dette Client Totale" value={formatCurrency(data?.stats.totalOutstandingDebt ?? 0)} icon={CreditCard} isLoading={isLoading} href="/customers?status=has_debt" />
                <StatCard title="Valeur de l'Inventaire" value={formatCurrency(data?.stats.totalInventoryValue ?? 0)} icon={Archive} isLoading={isLoading} href="/products" />
                <StatCard title="Nombre de Ventes" value={String(data?.stats.saleCount ?? 0)} icon={Receipt} isLoading={isLoading} href="/sales-history" change={data?.stats.saleCountChange} />
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                    <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TopProductsCard products={data?.topProducts ?? []} isLoading={isLoading} />
                    <TopCustomersCard customers={data?.topCustomers ?? []} isLoading={isLoading} />
                    <LowStockProductsCard products={data?.lowStockProducts ?? []} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}

    