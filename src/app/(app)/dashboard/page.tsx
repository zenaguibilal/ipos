'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale, ProductReturn, Product, Customer, Expense } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { CircleDollarSign, TrendingUp, Undo2, ShoppingCart, Users, Package, Award, Archive, Receipt, Banknote } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Colors for the Pie Chart
const PIE_COLORS = [
    'hsl(var(--chart-primary))',
    'hsl(var(--chart-secondary))',
    'hsl(var(--chart-tertiary))',
    'hsl(var(--chart-quaternary))',
    'hsl(var(--chart-quinary))',
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't render label for small slices

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function calculateDashboardMetrics(
  sales: Sale[] | undefined,
  returns: ProductReturn[] | undefined,
  expenses: Expense[] | undefined,
  dateRange: DateRange | undefined
) {
    if (!sales || !returns || !expenses) {
      return {
          netRevenue: 0,
          netSalesProfit: 0,
          totalExpenses: 0,
          trueNetProfit: 0,
          profitMargin: 0,
          totalReturnsValue: 0,
          salesCount: 0,
          chartData: [],
          recentTransactions: [],
          topProducts: [],
          topCustomers: [],
      };
    }

    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : null;

    const filteredSales = sales.filter(s => {
        if (!s.createdAt) return false;
        const saleDate = safeToDate(s.createdAt);
        return (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate);
    });

    const filteredReturns = returns.filter(r => {
        if (!r.createdAt) return false;
        const returnDate = safeToDate(r.createdAt);
        return (!fromDate || returnDate >= fromDate) && (!toDate || returnDate <= toDate);
    });

    const filteredExpenses = expenses.filter(e => {
        const expenseDate = safeToDate(e.expenseDate);
        return (!fromDate || expenseDate >= fromDate) && (!toDate || expenseDate <= toDate);
    });

    let grossRevenue = 0;
    let grossProfit = 0;
    let returnsValue = 0;
    let lostProfitFromReturns = 0;
    
    const topProductsMap: { [name: string]: { totalRevenue: number; unitsSold: number; totalProfit: number; } } = {};
    const topCustomersMap: { [name: string]: { totalSpent: number; } } = {};
    const dailyData: { [key: string]: { revenue: number, profit: number } } = {};
    const allTransactionsForPeriod: { type: 'Vente' | 'Retour', date: Date, customerName: string, invoiceNumber: string, amount: number }[] = [];
    
    if (fromDate && toDate) {
        const interval = eachDayOfInterval({ start: fromDate, end: toDate });
        for (const day of interval) {
            const dateKey = format(day, 'yyyy-MM-dd');
            dailyData[dateKey] = { revenue: 0, profit: 0 };
        }
    }

    for (const sale of filteredSales) {
        allTransactionsForPeriod.push({
            type: 'Vente',
            date: safeToDate(sale.createdAt!),
            customerName: sale.customerName || 'N/A',
            invoiceNumber: sale.invoiceNumber,
            amount: sale.total,
        });
        grossRevenue += sale.total;
        
        if (sale.customerName) {
             if (!topCustomersMap[sale.customerName]) {
                topCustomersMap[sale.customerName] = { totalSpent: 0 };
            }
            topCustomersMap[sale.customerName].totalSpent += sale.total;
        }
        
        let saleProfit = 0;
        sale.items.forEach((item) => {
            const purchasePrice = item.purchasePrice || 0;
            const quantity = item.quantity;

            if (!topProductsMap[item.name]) {
                topProductsMap[item.name] = { totalRevenue: 0, unitsSold: 0, totalProfit: 0 };
            }

            const itemProfit = (item.price && purchasePrice) ? (item.price - purchasePrice) * quantity : 0;
            
            topProductsMap[item.name].unitsSold += quantity;
            topProductsMap[item.name].totalRevenue += item.price * quantity;
            topProductsMap[item.name].totalProfit += itemProfit;
            
            saleProfit += itemProfit;
        });
        grossProfit += saleProfit;

        if(sale.createdAt) {
            const dateKey = format(safeToDate(sale.createdAt), 'yyyy-MM-dd');
            if (dailyData[dateKey]) {
                dailyData[dateKey].revenue += sale.total;
                dailyData[dateKey].profit += saleProfit;
            }
        }
    }

    for (const ret of filteredReturns) {
        allTransactionsForPeriod.push({
            type: 'Retour',
            date: safeToDate(ret.createdAt!),
            customerName: ret.customerName || 'N/A',
            invoiceNumber: ret.originalInvoiceNumber,
            amount: ret.totalReturnValue,
        });
        returnsValue += ret.totalReturnValue;

        let returnProfitLoss = 0;
        for (const item of ret.items) {
            const purchasePrice = item.purchasePrice || 0;
            const profitLoss = (item.price - purchasePrice) * item.quantity;
            returnProfitLoss += profitLoss;

            if (topProductsMap[item.productName]) {
                topProductsMap[item.productName].unitsSold -= item.quantity;
                topProductsMap[item.productName].totalRevenue -= item.price * item.quantity;
                topProductsMap[item.productName].totalProfit -= profitLoss;
            }
        }
        lostProfitFromReturns += returnProfitLoss;
        
        if (ret.customerName && topCustomersMap[ret.customerName]) {
            topCustomersMap[ret.customerName].totalSpent -= ret.totalReturnValue;
        }

        if (ret.createdAt) {
            const dateKey = format(safeToDate(ret.createdAt), 'yyyy-MM-dd');
            if (dailyData[dateKey]) {
                dailyData[dateKey].revenue -= ret.totalReturnValue;
                dailyData[dateKey].profit -= returnProfitLoss;
            }
        }
    }
    
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const finalNetRevenue = grossRevenue - returnsValue;
    const finalNetSalesProfit = grossProfit - lostProfitFromReturns;
    const finalTrueNetProfit = finalNetSalesProfit - totalExpenses;
    const finalProfitMargin = finalNetRevenue > 0 ? (finalNetSalesProfit / finalNetRevenue) * 100 : 0;
    
    const finalChartData = Object.keys(dailyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).map(dateKey => ({
        date: format(parse(dateKey, 'yyyy-MM-dd', new Date()), 'd MMM', { locale: fr }),
        'Chiffre d\'affaires Net': dailyData[dateKey].revenue,
        'Bénéfice Net': dailyData[dateKey].profit,
    }));
    
    const recentTransactions = allTransactionsForPeriod
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

    const topProductsList = Object.entries(topProductsMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);

    const topCustomersList = Object.entries(topCustomersMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

    return {
        netRevenue: finalNetRevenue,
        netSalesProfit: finalNetSalesProfit,
        totalExpenses: totalExpenses,
        trueNetProfit: finalTrueNetProfit,
        profitMargin: finalProfitMargin,
        totalReturnsValue: returnsValue,
        salesCount: filteredSales.length,
        chartData: finalChartData,
        recentTransactions,
        topProducts: topProductsList,
        topCustomers: topCustomersList
    };
}


export default function DashboardPage() {
    const sales = useLiveQuery(() => db.sales.toArray());
    const returns = useLiveQuery(() => db.returns.toArray());
    const products = useLiveQuery(() => db.products.toArray());
    const customers = useLiveQuery(() => db.customers.toArray());
    const expenses = useLiveQuery(() => db.expenses.toArray());
    
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (typeof window === 'undefined') {
            return { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) };
        }
        try {
            const storedRange = localStorage.getItem('dashboard_date_range');
            if (storedRange) {
                const parsed = JSON.parse(storedRange);
                return {
                    from: parsed.from ? new Date(parsed.from) : undefined,
                    to: parsed.to ? new Date(parsed.to) : undefined,
                };
            }
        } catch (e) {
            console.error(e);
        }
        return { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) };
    });

    useEffect(() => {
        if (dateRange) {
            localStorage.setItem('dashboard_date_range', JSON.stringify(dateRange));
        }
    }, [dateRange]);

    const inventoryValue = useMemo(() => {
        return products?.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0) || 0;
    }, [products]);

    const totalCustomers = useMemo(() => {
        return customers?.length || 0;
    }, [customers]);

    const {
        netRevenue,
        netSalesProfit,
        totalExpenses,
        trueNetProfit,
        profitMargin,
        totalReturnsValue,
        salesCount,
        chartData,
        recentTransactions,
        topProducts,
        topCustomers
    } = useMemo(() => {
        return calculateDashboardMetrics(sales, returns, expenses, dateRange);
    }, [sales, returns, expenses, dateRange]);
    
    const formatCurrency = (value: number) => `${value.toFixed(1)} DA`;

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                    <p className="text-muted-foreground">
                        Aperçu des performances de votre commerce.
                    </p>
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires Net</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(netRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Après déduction des retours</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bénéfice sur Ventes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(netSalesProfit)}</div>
                         <p className="text-xs text-muted-foreground">
                            {netRevenue > 0 ? `Marge de ${profitMargin.toFixed(1)}% sur la période` : 'Bénéfice net des ventes'}
                         </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground">Charges sur la période sélectionnée</p>
                    </CardContent>
                </Card>
                 <Card className="bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Bénéfice Réel</CardTitle>
                        <Banknote className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(trueNetProfit)}</div>
                        <p className="text-xs text-muted-foreground">Bénéfice sur ventes moins les dépenses</p>
                    </CardContent>
                </Card>
            </div>
            
             <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Analyse des Revenus</CardTitle>
                        <CardDescription>Chiffre d'affaires net et bénéfice net sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                         <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value} DA`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        borderColor: "hsl(var(--border))",
                                    }}
                                    formatter={(value: number) => formatCurrency(value)}
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                                <Bar dataKey="Chiffre d'affaires Net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Bénéfice Net" fill="hsl(var(--chart-secondary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Activité Récente</CardTitle>
                        <CardDescription>Les 5 dernières transactions de la période.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {recentTransactions.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-muted-foreground">Aucune activité récente.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Client/Facture</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.map((tx, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className={`flex items-center gap-2 text-xs font-semibold ${tx.type === 'Vente' ? 'text-primary' : 'text-destructive'}`}>
                                                    {tx.type === 'Vente' ? <ShoppingCart className="h-4 w-4"/> : <Undo2 className="h-4 w-4"/>}
                                                    {tx.type}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{tx.customerName}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{tx.invoiceNumber}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-6 mt-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-muted-foreground" /> Produits les plus rentables</CardTitle>
                        <CardDescription>Top 5 des produits par bénéfice net sur la période.</CardDescription>
                    </CardHeader>
                     <CardContent className="h-[300px]">
                        {topProducts.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                <p>Aucune donnée de vente pour afficher les meilleurs produits.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 h-full items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={topProducts}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={100}
                                            innerRadius={60}
                                            paddingAngle={2}
                                            dataKey="totalProfit"
                                            nameKey="name"
                                        >
                                            {topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={'hsl(var(--background))'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Bénéfice Net']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col justify-center space-y-3">
                                    {topProducts.map((product, index) => (
                                        <div key={product.name} className="flex items-center">
                                            <div className="h-3 w-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                            <div className="flex-1 text-sm">
                                                <div className="font-medium truncate" title={product.name}>{product.name}</div>
                                                <div className="text-xs text-muted-foreground font-semibold">{formatCurrency(product.totalProfit)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-muted-foreground" /> Meilleurs clients</CardTitle>
                        <CardDescription>Top 5 des clients par total d'achats net sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {topCustomers.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                <p>Aucune donnée de vente pour afficher les meilleurs clients.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topCustomers} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={120}
                                        tickLine={false} 
                                        axisLine={false} 
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tick={{ transform: 'translate(-10, 0)' }}
                                        style={{ textAnchor: 'start' }}
                                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}…` : value}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--background))",
                                            borderColor: "hsl(var(--border))",
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Total Dépensé']}
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                    />
                                    <Bar dataKey="totalSpent" name="Total Dépensé" fill="hsl(var(--chart-tertiary))" radius={[0, 4, 4, 0]} barSize={20}>
                                        {/* You can add labels inside the bars if you want */}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clients Totaux</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">Nombre total de clients enregistrés</p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
