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
            const [sales, expenses, returns, customers, allProducts] = await Promise.all([
                saleRepository.filter({ from, to }),
                expenseRepository.filter({ from, to }),
                returnRepository.filter({ from, to }),
                customerRepository.getAll(),
                productRepository.getAll(),
            ]);

            const customerMap = new Map(customers.map(c => [c.uuid, `${c.firstName} ${c.lastName}`]));
            const defaultCustomerName = 'Client de passage';

            // Calculate stats
            const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
            const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            const netProfit = totalRevenue - totalExpenses;
            const saleCount = sales.length;

            // Process sales by day for chart
            const salesByDayMap = new Map<string, { total: number, profit: number }>();
            const interval = eachDayOfInterval({ start: from, end: to });
            interval.forEach(day => {
                salesByDayMap.set(format(day, 'yyyy-MM-dd'), { total: 0, profit: 0 });
            });

            sales.forEach(sale => {
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


            // Get Top Selling Products
            const productSales = new Map<string, { quantitySold: number, revenueGenerated: number }>();
            sales.forEach(sale => {
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
                .sort((a, b) => b[1].revenueGenerated - a[1].revenueGenerated) // Sort by revenue
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
            
            // Get Top Customers
            const customerSpending = new Map<string, number>();
            sales.forEach(sale => {
                if (!sale.customerUuid) return;
                const currentSpending = customerSpending.get(sale.customerUuid) || 0;
                customerSpending.set(sale.customerUuid, currentSpending + sale.total);
            });

            const topCustomersData = Array.from(customerSpending.entries())
                .sort((a, b) => b[1] - a[1]) // sort by spending
                .slice(0, 5);
            
            const topCustomers: TopCustomer[] = topCustomersData.map(([uuid, totalSpent]) => ({
                customerUuid: uuid,
                name: customerMap.get(uuid) || 'Client Inconnu',
                totalSpent,
            }));


            // Get Low Stock Products
            const lowStockProducts = allProducts
                .filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel)
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 5);
                

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
