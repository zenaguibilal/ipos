'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardData, RecentSale, RecentReturn, SalesByDay, TopProduct, LowStockProduct } from '@/lib/types';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Receipt, Undo2 } from 'lucide-react';
import { formatCurrency, safeToDate, getPlaceholder } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

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
    <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle>Aperçu Financier</CardTitle>
            <CardDescription>Évolution du chiffre d'affaires et du bénéfice brut sur la période.</CardDescription>
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
                 <div className="mt-4">
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

const TopProductsCard = ({ products, isLoading }: { products: TopProduct[], isLoading: boolean }) => (
    <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle>Top Produits Vendus</CardTitle>
            <CardDescription>Produits les plus vendus sur la période sélectionnée.</CardDescription>
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
                            </div>
                            <div className="font-bold text-lg">{p.quantitySold} <span className="text-sm text-muted-foreground">vendus</span></div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
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

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SalesChart data={data?.salesByDay ?? []} isLoading={isLoading}/>
                    <RecentActivity sales={data?.recentSales ?? []} returns={data?.recentReturns ?? []} isLoading={isLoading}/>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TopProductsCard products={data?.topProducts ?? []} isLoading={isLoading} />
                    <LowStockProductsCard products={data?.lowStockProducts ?? []} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
