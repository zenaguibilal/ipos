import { createClient } from "@/utils/supabase/server";
import { ProductRepository } from './product.repository';
import { SaleRepository } from './sale.repository';
import { CustomerRepository } from './customer.repository';
import { ExpenseRepository } from './expense.repository';
import { startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

/**
 * @fileOverview Dashboard Repository (Absolute Data Authority)
 * المسؤول عن تجميع الإحصائيات الحتمية من كافة المستودعات ومعالجتها في جهة الخادم.
 */
export class DashboardRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private saleRepo = new SaleRepository();
    private customerRepo = new CustomerRepository();
    private expenseRepo = new ExpenseRepository();

    async getAnalytics(from: Date, to: Date): Promise<any> {
        const [products, sales, customers, expenses] = await Promise.all([
            this.productRepo.getAll(),
            this.saleRepo.getAll(),
            this.customerRepo.getAll(),
            this.expenseRepo.getAll(),
        ]);

        const filteredSales = sales.filter(s => {
            const d = new Date(s.createdAt);
            return d >= from && d <= to;
        });

        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.expenseDate);
            return d >= from && d <= to;
        });

        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        let totalCOGS = 0;
        filteredSales.forEach(s => {
            s.items.forEach(item => {
                totalCOGS += (item.purchasePrice || 0) * item.quantity;
            });
        });

        const netProfit = totalRevenue - totalCOGS - totalExpenses;
        const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);

        const salesByDayMap = new Map();
        eachDayOfInterval({ start: from, end: to }).forEach(day => {
            salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
        });

        filteredSales.forEach(s => {
            const dayKey = format(new Date(s.createdAt), 'yyyy-MM-dd');
            if (salesByDayMap.has(dayKey)) {
                const current = salesByDayMap.get(dayKey);
                const saleCOGS = s.items.reduce((acc, i) => acc + (i.purchasePrice * i.quantity), 0);
                salesByDayMap.set(dayKey, {
                    total: current.total + s.total,
                    profit: current.profit + (s.total - saleCOGS)
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
                totalRevenue,
                totalExpenses,
                netProfit,
                saleCount: filteredSales.length,
                totalOutstandingDebt,
                totalInventoryValue,
            },
            salesByDay,
            recentSales: filteredSales.slice(0, 5),
            lowStockProducts: products.filter(p => p.quantity <= p.minStockLevel).slice(0, 5)
        };
    }
}
