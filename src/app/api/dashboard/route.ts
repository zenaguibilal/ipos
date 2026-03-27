
import { NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { ExpenseRepository } from '@/repositories/expense.repository';
import { ReturnRepository } from '@/repositories/return.repository';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

/**
 * @fileOverview API WALL: Unified Dashboard Analytics
 * يقوم بمعالجة كافة البيانات الإحصائية في جهة الخادم لضمان الحتمية والأداء.
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const from = fromParam ? new Date(fromParam) : startOfDay(subDays(new Date(), 30));
        const to = toParam ? new Date(toParam) : endOfDay(new Date());

        const productRepo = new ProductRepository();
        const saleRepo = new SaleRepository();
        const customerRepo = new CustomerRepository();
        const expenseRepo = new ExpenseRepository();

        // Fetch everything in parallel via Repositories (Server Side)
        const [products, sales, customers, expenses] = await Promise.all([
            productRepo.getAll(),
            saleRepo.getAll(),
            customerRepo.getAll(),
            expenseRepo.getAll(),
        ]);

        // Filter data by date range on server
        const filteredSales = sales.filter(s => {
            const d = new Date(s.createdAt);
            return d >= from && d <= to;
        });

        const filteredExpenses = expenses.filter(e => {
            const d = new Date(e.expenseDate);
            return d >= from && d <= to;
        });

        // Calculate Revenue, COGS and Profit
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

        // Map sales by day for chart
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

        return NextResponse.json({
            data: {
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
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
