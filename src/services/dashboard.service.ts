
'use client';

import { saleRepository } from '@/repositories/sale.repository';
import { expenseRepository } from '@/repositories/expense.repository';
import { returnRepository } from '@/repositories/return.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { productRepository } from '@/repositories/product.repository';
import type { DashboardData, TopCustomer } from '@/lib/types';
import { eachDayOfInterval, format } from 'date-fns';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            // 1. Calculate previous period dates
            const duration = to.getTime() - from.getTime();
            const prevTo = new Date(from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);

            // 2. Fetch all data needed in an extended range
            const [allSales, allExpenses, returns, customers, allProducts] = await Promise.all([
                saleRepository.filter({ from: prevFrom, to }),
                expenseRepository.filter({ from: prevFrom, to }),
                returnRepository.filter({ from, to }), // Only need returns for current period's recent activity
                customerRepository.getAll(),
                productRepository.getAll(),
            ]);

            // 3. Split data into current and previous periods
            const currentSales = allSales.filter(s => new Date(s.createdAt!) >= from);
            const prevSales = allSales.filter(s => new Date(s.createdAt!) < from);

            const currentExpenses = allExpenses.filter(e => new Date(e.expenseDate) >= from);
            const prevExpenses = allExpenses.filter(e => new Date(e.expenseDate) < from);


            // 4. Calculate stats for CURRENT period
            const totalRevenue = currentSales.reduce((sum, sale) => sum + sale.total, 0);
            const totalExpenses = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            const saleCount = currentSales.length;
            const totalCOGS = currentSales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0), 0);
            const netProfit = totalRevenue - totalCOGS - totalExpenses;
            
            // 5. Calculate stats for PREVIOUS period
            const prevTotalRevenue = prevSales.reduce((sum, sale) => sum + sale.total, 0);
            const prevTotalExpenses = prevExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            const prevSaleCount = prevSales.length;
            const prevTotalCOGS = prevSales.reduce((sum, sale) => sum + sale.items.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0), 0);
            const prevNetProfit = prevTotalRevenue - prevTotalCOGS - prevTotalExpenses;

            // 6. Calculate percentage changes
            const calculateChange = (current: number, previous: number): number | undefined => {
                if (previous === 0) {
                    return current > 0 ? Infinity : 0;
                }
                return ((current - previous) / previous) * 100;
            };
            
            const totalRevenueChange = calculateChange(totalRevenue, prevTotalRevenue);
            const netProfitChange = calculateChange(netProfit, prevNetProfit);
            const totalExpensesChange = calculateChange(totalExpenses, prevTotalExpenses);
            const saleCountChange = calculateChange(saleCount, prevSaleCount);

            // Point-in-time stats (no comparison)
            const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
            const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);


            // --- Process data for charts and lists (for current period only) ---

            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));
            const defaultCustomerName = 'Client de passage';

            const salesByDayMap = new Map<string, { total: number, profit: number }>();
            const interval = eachDayOfInterval({ start: from, end: to });
            interval.forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            currentSales.forEach(sale => {
                const day = format(sale.createdAt!, 'yyyy-MM-dd');
                const saleCOGS = sale.items.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0);
                const saleGrossProfit = sale.total - saleCOGS;

                if (salesByDayMap.has(day)) {
                    const current = salesByDayMap.get(day)!;
                    salesByDayMap.set(day, {
                        total: current.total + sale.total,
                        profit: current.profit + saleGrossProfit,
                    });
                }
            });

            const salesByDay = Array.from(salesByDayMap.entries())
                .map(([date, values]) => ({ date, ...values }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const productSales = new Map<string, { quantitySold: number, revenueGenerated: number }>();
            currentSales.forEach(sale => {
                sale.items.forEach(item => {
                    if (!item.productUuid) return;
                    const current = productSales.get(item.productUuid) || { quantitySold: 0, revenueGenerated: 0 };
                    current.quantitySold += item.quantity;
                    const itemSubtotal = item.price * item.quantity;
                    const itemRevenue = sale.subtotal > 0 ? (itemSubtotal / sale.subtotal) * sale.total : itemSubtotal;
                    current.revenueGenerated += itemRevenue;
                    productSales.set(item.productUuid, current);
                });
            });

            const topProductsData = Array.from(productSales.entries())
                .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated)
                .slice(0, 5);

            const topProducts = topProductsData.map(([uuid, stats]) => {
                const product = allProducts.find(p => p.uuid === uuid);
                return {
                    productUuid: uuid,
                    name: product?.name || 'Produit Inconnu',
                    quantitySold: stats.quantitySold,
                    revenueGenerated: stats.revenueGenerated,
                    imageUrl: product?.imageUrl,
                    category: product?.category,
                };
            });
            
            const customerSpending = new Map<string, number>();
            currentSales.forEach(sale => {
                if (!sale.customerUuid) return;
                const currentSpending = customerSpending.get(sale.customerUuid) || 0;
                customerSpending.set(sale.customerUuid, currentSpending + sale.total);
            });

            const topCustomersData = Array.from(customerSpending.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            const topCustomers: TopCustomer[] = topCustomersData.map(([uuid, totalSpent]) => ({
                customerUuid: uuid,
                name: customerMap.get(uuid) || 'Client Inconnu',
                totalSpent,
            }));

            const lowStockProducts = allProducts
                .filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel)
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 5);
                
            const recentSales = currentSales
                .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                .slice(0, 5)
                .map(sale => ({
                    uuid: sale.uuid,
                    invoiceNumber: sale.invoiceNumber,
                    total: sale.total,
                    createdAt: sale.createdAt,
                    customerName: sale.customerUuid ? customerMap.get(sale.customerUuid) || 'Client Inconnu' : defaultCustomerName,
                }));

            const recentReturns = returns
                .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                .slice(0, 5)
                .map(pr => ({
                    uuid: pr.uuid,
                    originalInvoiceNumber: pr.originalInvoiceNumber,
                    totalReturnValue: pr.totalReturnValue,
                    createdAt: pr.createdAt,
                    customerName: pr.customerUuid ? customerMap.get(pr.customerUuid) || 'Client Inconnu' : defaultCustomerName,
                }));
                
            return {
                stats: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    saleCount,
                    totalOutstandingDebt,
                    totalInventoryValue,
                    totalRevenueChange,
                    netProfitChange,
                    totalExpensesChange,
                    saleCountChange,
                },
                salesByDay,
                recentSales,
                recentReturns,
                topProducts,
                topCustomers,
                lowStockProducts,
            };
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
