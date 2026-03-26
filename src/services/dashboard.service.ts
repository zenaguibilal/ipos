'use client';

import { saleRepository } from '@/repositories/sale.repository';
import { expenseRepository } from '@/repositories/expense.repository';
import { returnRepository } from '@/repositories/return.repository';
import { customerRepository } from '@/repositories/customer.repository';
import type { DashboardData, Sale, ProductReturn, Customer } from '@/lib/types';
import { eachDayOfInterval, format } from 'date-fns';

class DashboardService {
    async getDashboardData(from: Date, to: Date): Promise<DashboardData> {
        try {
            const [sales, expenses, returns, customers] = await Promise.all([
                saleRepository.filter({ from, to }),
                expenseRepository.filter({ from, to }),
                returnRepository.filter({ from, to }),
                customerRepository.getAll(),
            ]);

            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));
            const defaultCustomerName = 'Client de passage';

            // Calculate stats
            const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const netProfit = totalRevenue - totalExpenses;
            const saleCount = sales.length;

            // Process sales by day for chart
            const salesByDayMap = new Map<string, number>();
            const interval = eachDayOfInterval({ start: from, end: to });
            interval.forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), 0);
            });

            sales.forEach(sale => {
                const day = format(sale.createdAt!, 'yyyy-MM-dd');
                if (salesByDayMap.has(day)) {
                    salesByDayMap.set(day, salesByDayMap.get(day)! + sale.total);
                }
            });

            const salesByDay = Array.from(salesByDayMap.entries())
                .map(([date, total]) => ({ date, total }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


            // Get recent activities
            const recentSales = sales
                .slice(0, 5)
                .map(sale => ({
                    uuid: sale.uuid,
                    invoiceNumber: sale.invoiceNumber,
                    total: sale.total,
                    createdAt: sale.createdAt,
                    customerName: sale.customerUuid ? customerMap.get(sale.customerUuid) || 'Client Inconnu' : defaultCustomerName,
                }));

            const recentReturns = returns
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
                },
                salesByDay,
                recentSales,
                recentReturns,
            };
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
