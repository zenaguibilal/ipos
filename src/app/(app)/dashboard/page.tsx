'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, Sale, Customer, TopProduct, TopCustomer } from '@/lib/types';
import { Users, Package, DollarSign, Archive, TrendingUp, PackageWarning, HandCoins } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { SalesOverview } from '@/components/dashboard/SalesOverview';
import RevenueChart from '@/components/dashboard/RevenueChart';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const sales = useLiveQuery(() => {
        if (!dateRange?.from) return [];
        return db.sales.where('createdAt').between(dateRange.from, dateRange.to || new Date(), true, true).toArray();
    }, [dateRange]);

    const allProducts = useLiveQuery(() => db.products.toArray(), []);
    const allCustomers = useLiveQuery(() => db.customers.toArray(), []);
    
    const { filteredStats, topProducts, topCustomers } = useMemo(() => {
        const stats = { revenue: 0, profit: 0, salesCount: 0 };
        const productSales: { [key: string]: { unitsSold: number; totalRevenue: number; totalProfit: number; } } = {};
        const customerSpending: { [key: string]: number } = {};

        if (sales) {
            stats.salesCount = sales.length;
            sales.forEach(sale => {
                stats.revenue += sale.total;
                const saleProfit = sale.items.reduce((acc, item) => acc + (item.price - item.purchasePrice) * item.quantity, 0);
                stats.profit += saleProfit;

                if (sale.customerId && sale.customerName) {
                    customerSpending[sale.customerName] = (customerSpending[sale.customerName] || 0) + sale.total;
                }

                sale.items.forEach(item => {
                    const id = String(item.id);
                    if (!productSales[id]) {
                        productSales[id] = { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
                    }
                    productSales[id].unitsSold += item.quantity;
                    productSales[id].totalRevenue += item.price * item.quantity;
                    productSales[id].totalProfit += (item.price - item.purchasePrice) * item.quantity;
                });
            });
        }
        
        const topProductsData: TopProduct[] = Object.entries(productSales)
            .map(([id, data]) => {
                const product = allProducts?.find(p => String(p.id) === id);
                return { name: product?.name || `Produit ${id}`, ...data };
            })
            .sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
        
        const topCustomersData: TopCustomer[] = Object.entries(customerSpending)
            .map(([name, total]) => ({ name, totalSpent: total }))
            .sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

        return { filteredStats: stats, topProducts: topProductsData, topCustomers: topCustomersData };

    }, [sales, allProducts]);

    const globalStats = useMemo(() => {
        const inventoryValue = allProducts?.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0) || 0;
        const lowStockCount = allProducts?.filter(p => p.quantity <= p.minStockLevel).length || 0;
        const totalCustomers = allCustomers?.length || 0;
        const totalProducts = allProducts?.length || 0;
        
        return {
            inventoryValue,
            lowStockCount,
            totalCustomers,
            totalProducts
        };
    }, [allProducts, allCustomers]);


    const formatCurrency = (value: number) => `${value.toFixed(1)} DA`;

    const isLoading = sales === undefined || allProducts === undefined;

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                    <p className="text-muted-foreground">
                        Aperçu de vos performances de vente et de votre activité.
                    </p>
                </div>
                 {isClient ? (
                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                ) : (
                    <Skeleton className="h-10 w-[260px]" />
                )}
            </div>
            
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(filteredStats.revenue)}</div>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(filteredStats.profit)}</div>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ventes</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent>{isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{filteredStats.salesCount}</div>}</CardContent>
                </Card>
            </div>
            
             <div className="grid gap-6 lg:grid-cols-5 mb-6">
                <div className="lg:col-span-3">
                    <RevenueChart sales={sales} isLoading={isLoading} />
                </div>
                 <div className="lg:col-span-2">
                    <SalesOverview topProducts={topProducts} topCustomers={topCustomers} isLoading={isLoading} />
                </div>
            </div>

            <div className="mt-6 pt-6 border-t">
                <h2 className="text-xl font-bold mb-4">Aperçu Global de l'Entreprise</h2>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(globalStats.inventoryValue)}</div><p className="text-xs text-muted-foreground">Valeur totale des produits en stock.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stock Faible</CardTitle><PackageWarning className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-yellow-600">{globalStats.lowStockCount}</div><p className="text-xs text-muted-foreground">Nombre de produits en stock faible.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clients Totaux</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{globalStats.totalCustomers}</div><p className="text-xs text-muted-foreground">Nombre total de clients enregistrés.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Produits Totaux</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{globalStats.totalProducts}</div><p className="text-xs text-muted-foreground">Nombre total de produits uniques.</p></CardContent>
                    </Card>
                </div>
            </div>

        </main>
    );
}
