'use client';

import { db } from '@/lib/database';
import type { Sale, Customer } from '@/lib/types';
import { toast } from 'sonner';
import { processSaleTransaction } from '@/lib/sale-processor';

export class SalesService {
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return await db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }
    
    async getSales(params: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        let collection = db.sales.orderBy('createdAt').reverse();
        
        if (params.from && params.to) {
             collection = collection.filter(s => s.createdAt! >= params.from! && s.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.invoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }

    async addSale(saleData: any): Promise<number> {
        return db.transaction('rw', db.sales, db.products, db.customers, async () => {
            const { saleId, invoiceNumber } = await processSaleTransaction(saleData);
            toast.success(`Vente #${invoiceNumber} finalisée.`);
            return saleId;
        });
    }
    
    async deleteSale(saleId: number): Promise<void> {
        await db.transaction('rw', db.sales, db.products, db.customers, async () => {
            const sale = await db.sales.get(saleId);
            if (!sale) return;
    
            const stockUpdates = new Map<number, number>();
            for (const item of sale.items) {
                if (typeof item.id === 'number') {
                    stockUpdates.set(item.id, (stockUpdates.get(item.id) || 0) + item.quantity);
                }
            }
    
            if (stockUpdates.size > 0) {
                const productIds = Array.from(stockUpdates.keys());
                await db.products.where('id').anyOf(productIds).modify((product, ref) => {
                    const quantityToAdd = stockUpdates.get(ref.value.id);
                    if(quantityToAdd) {
                        ref.value.quantity += quantityToAdd;
                    }
                });
            }
    
            if (sale.customerId) {
                const customer = await db.customers.get(sale.customerId);
                if (customer) {
                    const newBalance = customer.outstandingBalance - sale.remainingBalance;
                    const newTotalSpent = customer.totalSpent - sale.total;
                    const isOverLimit = customer.creditLimit != null && newBalance > customer.creditLimit;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.id !== saleId && s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }
    
                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        totalSpent: newTotalSpent,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }
    
            await db.sales.delete(saleId);
        });
    }
}
