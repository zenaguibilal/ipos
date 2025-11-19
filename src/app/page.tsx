'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, collectionGroup } from 'firebase/firestore';
import type { Customer, Product, SaleWithDetails, Sale } from '@/lib/types';
import { useCustomers, useProducts } from '@/lib/data';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader, Package, Users, DollarSign, ArrowUpRight } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';


function StatCard({ title, value, icon, description, colorClass }: { title: string, value: string, icon: React.ReactNode, description: string, colorClass?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={colorClass}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function RecentSales({ sales, customers }: { sales: SaleWithDetails[], customers: Customer[] }) {
  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>
            Les 5 dernières ventes réalisées.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/sales-history">
            Voir Tout
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const customer = customerMap.get(sale.customerId);
              return (
              <TableRow key={sale.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={customer?.avatarUrl || ''} alt="Avatar" data-ai-hint={customer?.avatarHint || 'person avatar'}/>
                        <AvatarFallback>{customer?.name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{customer?.name || "Client Général"}</div>
                  </div>
                </TableCell>
                 <TableCell className="hidden sm:table-cell">
                  <Badge className="text-xs" variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                    {sale.paymentMethod === 'cash' ? 'Comptant' : 'Crédit'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                   {format(new Date(sale.saleDate), "d MMM yyyy, HH:mm", { locale: fr })}
                </TableCell>
                <TableCell className="text-right">{(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}</TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


function SalesChart({ salesData }: { salesData: { name: string; total: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aperçu des Ventes</CardTitle>
        <CardDescription>Ventes des 7 derniers jours.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={salesData}>
                <XAxis
                    dataKey="name"
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
                    tickFormatter={(value) => `${(value as number / 100).toFixed(0)} DZD`}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-1 gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {label}
                                    </span>
                                    <span className="font-bold text-foreground">
                                        {(payload[0].value as number / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                                    </span>
                                </div>
                                </div>
                            </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


export function useSalesDashboard() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        return query(
            collectionGroup(firestore, 'sales'),
            where('saleDate', '>=', sevenDaysAgo),
            orderBy('saleDate', 'desc')
        );
    }, [firestore]);
    
    const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesQuery);

    const recentSalesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'sales'),
            orderBy('saleDate', 'desc'),
            limit(5)
        );
    }, [firestore]);
    const { data: recentSales, isLoading: recentSalesLoading } = useCollection<SaleWithDetails>(recentSalesQuery);

    const { customers, isLoading: customersLoading } = useCustomers();

    const salesLast7Days = useMemo(() => {
        if (!sales) return [];
        const dailySales = new Map<string, number>();

        for (let i = 0; i < 7; i++) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'd MMM', { locale: fr });
            dailySales.set(formattedDate, 0);
        }

        sales.forEach(sale => {
            const saleDate = new Date(sale.saleDate);
            const formattedDate = format(saleDate, 'd MMM', { locale: fr });
            if (dailySales.has(formattedDate)) {
                dailySales.set(formattedDate, (dailySales.get(formattedDate) || 0) + sale.totalAmount);
            }
        });
        
        return Array.from(dailySales.entries())
            .map(([name, total]) => ({ name, total }))
            .reverse();

    }, [sales]);
    
    const totalRevenue = useMemo(() => sales?.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0, [sales]);
    const totalSales = sales?.length || 0;

    const customersWithSales = useMemo(() => new Set(sales?.map(s => s.customerId)), [sales]);
    const activeCustomers = customers.filter(c => customersWithSales.has(c.id)).length;
    
    const isLoading = salesLoading || recentSalesLoading || customersLoading;

    return { 
        salesLast7Days, 
        totalRevenue, 
        totalSales,
        activeCustomers, 
        recentSales: recentSales || [], 
        customers,
        isLoading 
    };
}


export default function DashboardPage() {
    const { products, isLoading: productsLoading } = useProducts();
    const { 
        salesLast7Days, 
        totalRevenue, 
        totalSales, 
        activeCustomers,
        recentSales,
        customers, 
        isLoading: salesLoading 
    } = useSalesDashboard();
    
    const isLoading = productsLoading || salesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
  
    return (
        <div className="flex flex-col gap-4">
             <div className="grid gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord</h1>
                <p className="text-muted-foreground">Voici un aperçu de votre activité commerciale.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Revenu Total (7 jours)" 
                    value={(totalRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                    description={`${totalSales} ventes`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard 
                    title="Clients Actifs (7 jours)" 
                    value={`+${activeCustomers}`}
                    description="Clients ayant effectué un achat"
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard 
                    title="Produits en Stock" 
                    value={`${products.length}`}
                    description="Nombre total de produits"
                    icon={<Package className="h-4 w-4 text-muted-foreground" />}
                />
                 {/* This could be another relevant stat in the future */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        À venir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                        Statistique future
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                  <SalesChart salesData={salesLast7Days} />
                </div>
                <div className="col-span-full lg:col-span-3">
                  <RecentSales sales={recentSales} customers={customers} />
                </div>
            </div>
        </div>
    )
}
