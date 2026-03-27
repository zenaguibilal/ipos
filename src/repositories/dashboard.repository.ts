import { ProductRepository } from './product.repository';
import { SaleRepository } from './sale.repository';
import { CustomerRepository } from './customer.repository';
import { ExpenseRepository } from './expense.repository';
import { format, eachDayOfInterval, subDays, differenceInDays } from 'date-fns';

/**
 * @fileOverview Dashboard Repository (Absolute Data Authority)
 * Responsible for aggregating deterministic statistics and calculating Period-over-Period changes.
 */
export class DashboardRepository {
    private productRepo = new ProductRepository();
    private saleRepo = new SaleRepository();
    private customerRepo = new CustomerRepository();
    private expenseRepo = new ExpenseRepository();

    async getAnalytics(from: Date, to: Date): Promise<any> {
        // Calculate the duration of the current period to define the previous period
        const duration = differenceInDays(to, from) + 1;
        const prevFrom = subDays(from, duration);
        const prevTo = subDays(from, 1);

        const [products, sales, customers, expenses] = await Promise.all([
            this.productRepo.getAll(),
            this.saleRepo.getAll(),
            this.customerRepo.getAll(),
            this.expenseRepo.getAll(),
        ]);

        // Helper to get stats for a specific date range
        const getStatsForRange = (startDate: Date, endDate: Date) => {
            const filteredSales = sales.filter(s => {
                const d = new Date(s.createdAt);
                return d >= startDate && d <= endDate;
            });

            const filteredExpenses = expenses.filter(e => {
                const d = new Date(e.expenseDate);
                return d >= startDate && d <= endDate;
            });

            const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
            const expenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            let totalCOGS = 0;
            filteredSales.forEach(s => {
                s.items.forEach(item => {
                    totalCOGS += (item.purchasePrice || 0) * item.quantity;
                });
            });

            const profit = revenue - totalCOGS - expenseSum;
            const saleCount = filteredSales.length;

            return { revenue, expenseSum, profit, saleCount };
        };

        const current = getStatsForRange(from, to);
        const previous = getStatsForRange(prevFrom, prevTo);

        // Calculate Percentage Changes
        const calculateChange = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        const totalRevenueChange = calculateChange(current.revenue, previous.revenue);
        const netProfitChange = calculateChange(current.profit, previous.profit);
        const totalExpensesChange = calculateChange(current.expenseSum, previous.expenseSum);
        const saleCountChange = calculateChange(current.saleCount, previous.saleCount);

        const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);

        // Get Top Products for the current period
        const currentSales = sales.filter(s => {
            const d = new Date(s.createdAt);
            return d >= from && d <= to;
        });

        const productSalesMap = new Map();
        currentSales.forEach(s => {
            s.items.forEach(item => {
                const currentP = productSalesMap.get(item.productUuid) || { name: item.name, quantity: 0, revenue: 0 };
                currentP.quantity += item.quantity;
                currentP.revenue += (item.price * item.quantity);
                productSalesMap.set(item.productUuid, currentP);
            });
        });

        const topProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Generate Chart Data
        const salesByDayMap = new Map();
        eachDayOfInterval({ start: from, end: to }).forEach(day => {
            salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
        });

        currentSales.forEach(s => {
            const dayKey = format(new Date(s.createdAt), 'yyyy-MM-dd');
            if (salesByDayMap.has(dayKey)) {
                const dayVal = salesByDayMap.get(dayKey);
                const saleCOGS = s.items.reduce((acc, i) => acc + (i.purchasePrice * i.quantity), 0);
                salesByDayMap.set(dayKey, {
                    total: dayVal.total + s.total,
                    profit: dayVal.profit + (s.total - saleCOGS)
                });
            }
        });

        const salesByDay = Array.from(salesByDayMap.entries()).map(([date, val]) => ({
            date,
            total: val.total,
            profit: val.profit
        }));

        return {
            stats: {
                totalRevenue: current.revenue,
                totalExpenses: current.expenseSum,
                netProfit: current.profit,
                saleCount: current.saleCount,
                totalOutstandingDebt,
                totalInventoryValue,
                totalRevenueChange,
                netProfitChange,
                totalExpensesChange,
                saleCountChange
            },
            salesByDay,
            topProducts,
            recentSales: currentSales.slice(0, 10),
            lowStockProducts: products
                .filter(p => p.quantity <= p.minStockLevel)
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 10)
        };
    }
}
