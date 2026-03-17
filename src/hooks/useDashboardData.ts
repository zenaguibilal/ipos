'use client';

import { useMemo, useState, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import type { DateRange } from 'react-day-picker';
import type { Product, Sale, StockIntake, Customer, ProductReturn, Expense, GlobalActivityItem, DashboardDataType } from '@/lib/types';
import { differenceInDays, subDays, format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const INITIAL_DATA: DashboardDataType = {
  kpis: {
    revenue: { current: 0, vs: 0 },
    profit: { current: 0, vs: 0 },
    sales: { current: 0, vs: 0 },
    inventoryValue: { current: 0, productCount: 0 },
  },
  chartData: [],
  stockAlerts: [],
  recentActivity: [],
  topProducts: [],
  expensesData: [],
};

type FetchedData = {
    currentSales: Sale[];
    previousSales: Sale[];
    products: Product[];
    expenses: Expense[];
    recentSales: Sale[];
    recentIntakes: StockIntake[];
    recentCustomers: Customer[];
    recentReturns: ProductReturn[];
} | null;

export function useDashboardData(dateRange?: DateRange) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [liveData, setLiveData] = useState<FetchedData>(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    useEffect(() => {
        if (!from || !to) {
            setIsLoading(true);
            setLiveData(null);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const periodDays = differenceInDays(to, from);
                const prevFrom = startOfDay(subDays(from, periodDays + 1));
                const prevTo = endOfDay(subDays(from, 1));
                
                const [
                    currentSales,
                    previousSales,
                    products,
                    expenses,
                    recentSales,
                    recentIntakes,
                    recentCustomers,
                    recentReturns
                ] = await Promise.all([
                    dataService.getSales({ from, to }),
                    dataService.getSales({ from: prevFrom, to: prevTo }),
                    dataService.getAll<Product>('products'),
                    dataService.getExpenses({ from, to }),
                    dataService.getSales({ from: subDays(new Date(), 7), to: new Date() }),
                    dataService.getStockIntakes({ from: subDays(new Date(), 7), to: new Date() }),
                    dataService.getCustomers({ sortBy: 'createdAt_desc', limit: 5 }),
                    dataService.getReturns({ from: subDays(new Date(), 7), to: new Date() }),
                ]);

                setLiveData({ 
                    currentSales, previousSales, products, expenses, 
                    recentSales, recentIntakes, recentCustomers, recentReturns 
                });
            } catch (e) {
                console.error("Dashboard data fetching error:", e);
                setError("Impossible de charger les données du tableau de bord.");
                setLiveData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [from, to]);

    const processedData = useMemo<DashboardDataType>(() => {
        if (!liveData) {
            return INITIAL_DATA;
        }
        
        const { 
            currentSales, previousSales, products, expenses, 
            recentSales, recentIntakes, recentCustomers, recentReturns 
        } = liveData;

        // --- KPIs ---
        const calculateMetrics = (sales: Sale[]) => {
            let revenue = 0;
            let profit = 0;
            for (const sale of sales) {
                revenue += sale.total;
                const saleProfit = sale.items.reduce((acc, item) => acc + (item.price - item.purchasePrice) * item.quantity, 0);
                profit += isNaN(saleProfit) ? 0 : saleProfit;
            }
            return { revenue, profit, salesCount: sales.length };
        };

        const currentMetrics = calculateMetrics(currentSales);
        const previousMetrics = calculateMetrics(previousSales);
        
        const calcVs = (current: number, prev: number) => (prev > 0 ? ((current - prev) / prev) * 100 : (current > 0 ? 100 : 0));

        const kpis = {
            revenue: { current: currentMetrics.revenue, vs: calcVs(currentMetrics.revenue, previousMetrics.revenue) },
            profit: { current: currentMetrics.profit, vs: calcVs(currentMetrics.profit, previousMetrics.profit) },
            sales: { current: currentMetrics.salesCount, vs: calcVs(currentMetrics.salesCount, previousMetrics.salesCount) },
            inventoryValue: { 
                current: products.reduce((acc, p) => acc + (p.purchasePrice * p.quantity || 0), 0),
                productCount: products.length
            },
        };

        // --- Chart Data ---
        const daysInRange = to && from ? differenceInDays(to, from) + 1 : 0;
        const dataByDay: { [key: string]: { revenu: number, benefice: number, date: Date } } = {};

        for (let i = 0; i < daysInRange; i++) {
            const date = subDays(to!, i);
            const key = format(date, 'd MMM', { locale: fr });
            if (!dataByDay[key]) {
                dataByDay[key] = { revenu: 0, benefice: 0, date };
            }
        }
        
        currentSales.forEach(sale => {
            const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
            const key = format(saleDate, 'd MMM', { locale: fr });
            if (dataByDay[key]) {
                dataByDay[key].revenu += sale.total;
                const saleProfit = sale.items.reduce((acc, item) => acc + (item.price - item.purchasePrice) * item.quantity, 0);
                dataByDay[key].benefice += isNaN(saleProfit) ? 0 : saleProfit;
            }
        });
        
        const sortedChartData = Object.entries(dataByDay)
            .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
            .map(([key, value]) => ({ date: key, jour: key, revenu: value.revenu, benefice: value.benefice }));
        
        // --- Stock Alerts ---
        const stockAlerts = products
          .filter(p => p.quantity <= p.minStockLevel)
          .sort((a, b) => a.quantity - b.quantity)
          .slice(0, 5);

        // --- Recent Activity ---
        const activity: GlobalActivityItem[] = [
            ...recentSales.map(s => ({ type: 'sale', date: s.createdAt!, id: s.id!, description: `Vente #${s.invoiceNumber}`, details: s.customerName || 'Client de passage', amount: s.total, amountClass: 'text-primary' } as GlobalActivityItem)),
            ...recentIntakes.map(i => ({ type: 'stock_intake', date: i.createdAt!, id: i.id!, description: `Réception de ${i.supplierName}`, details: `${i.items.length} article(s)`, amount: i.totalValue, amountClass: 'text-[hsl(var(--chart-quaternary))]' } as GlobalActivityItem)),
            ...recentReturns.map(r => ({ type: 'return', date: r.createdAt!, id: r.id!, description: `Retour sur facture #${r.originalInvoiceNumber}`, details: `${r.items.length} article(s) retourné(s)`, amount: r.totalReturnValue, amountClass: 'text-destructive' } as GlobalActivityItem)),
            ...recentCustomers.map(c => ({ type: 'customer', date: c.createdAt!, id: c.id!, description: 'Nouveau client', details: `${c.firstName} ${c.lastName}` } as GlobalActivityItem)),
        ];
        const recentActivity = activity.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

        // --- Top Products ---
        const productSales = new Map<number, { product: Product; totalVendu: number }>();
        currentSales.forEach(sale => {
            sale.items.forEach(item => {
                if (typeof item.id === 'number') {
                    const product = products.find(p => p.id === item.id);
                    if (!product) return;
                    const existing = productSales.get(item.id) || { product, totalVendu: 0 };
                    productSales.set(item.id, { ...existing, totalVendu: existing.totalVendu + item.quantity });
                }
            });
        });
        const topProducts = Array.from(productSales.values())
            .sort((a,b) => b.totalVendu - a.totalVendu)
            .slice(0, 5)
            .map(p => ({...p.product, totalVendu: p.totalVendu}));

        // --- Expenses ---
        const expensesData = Object.entries(
            expenses.reduce((acc, d) => {
                acc[d.category] = (acc[d.category] || 0) + d.amount;
                return acc;
            }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));
        
        return { kpis, chartData: sortedChartData, stockAlerts, recentActivity, topProducts, expensesData };

    }, [liveData, error, from, to]);

    return { data: processedData, isLoading, error };
}
