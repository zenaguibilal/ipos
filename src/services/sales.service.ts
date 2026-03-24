'use client';

import { db } from '@/lib/database';
import type { Product, Sale, Customer, SaleItem } from '@/lib/types';
import { toast } from 'sonner';
import { startOfDay, endOfDay, format } from 'date-fns';

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
            const { saleId, invoiceNumber } = await this._processSale(saleData);
            toast.success(`Vente #${invoiceNumber} finalisée.`);
            return saleId;
        });
    }

    async _processSale(saleData: any): Promise<{ saleId: number, invoiceNumber: string }> {
        const now = new Date();
        
        const productIds = saleData.items
            .map((item: SaleItem) => item.id)
            .filter((id: any): id is number => typeof id === 'number');
        
        if (productIds.length > 0) {
            const productsInDb = await db.products.bulkGet(productIds);
            const productMap = new Map(productsInDb.filter((p): p is Product => !!p).map(p => [p.id!, p]));

            for (const item of saleData.items as SaleItem[]) {
                if (typeof item.id === 'number') {
                    const product = productMap.get(item.id);
                    if (!product || product.quantity < item.quantity) {
                        throw new Error(`Stock insuffisant pour "${item.name}". Disponible: ${product?.quantity ?? 0}, Demandé: ${item.quantity}`);
                    }
                }
            }
        }

        const today = format(now, 'yyMMdd');
        const lastSaleToday = await db.sales.where('createdAt').between(startOfDay(now), endOfDay(now), true, true).last();
        let sequence = 1;
        if (lastSaleToday) {
            const lastSequence = parseInt(lastSaleToday.invoiceNumber.split('-')[1], 10);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }
        const invoiceNumber = `${today}-${String(sequence).padStart(4, '0')}`;
        
        const remainingBalance = saleData.total - saleData.amountPaid;
        let paymentStatus: Sale['paymentStatus'];
        if (remainingBalance <= 0.01) { // Use a small tolerance for float comparison
            paymentStatus = 'paid';
        } else if (saleData.amountPaid > 0) {
            paymentStatus = 'partial';
        } else {
            paymentStatus = 'unpaid';
        }

        const customer = saleData.customerId ? await db.customers.get(saleData.customerId) : undefined;
        const dueDate = customer?.settlementDay ? new Date(now.getTime() + customer.settlementDay * 86400000) : saleData.dueDate;

        const finalSaleData: Sale = {
            ...saleData,
            invoiceNumber,
            createdAt: now,
            updatedAt: now,
            paymentStatus,
            remainingBalance,
            dueDate,
        };

        const saleId = await db.sales.add(finalSaleData);

        for (const item of finalSaleData.items) {
            if (typeof item.id === 'number') {
                await db.products.where('id').equals(item.id).modify(p => { p.quantity -= item.quantity; });
            }
        }
        
        if (customer) {
            const newBalance = customer.outstandingBalance + finalSaleData.remainingBalance;
            const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
            
            let debtStatus: Customer['debtStatus'] = 'none';
            if (newBalance > 0) {
                const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid' || s.id === saleId).toArray();
                const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
                debtStatus = isOverdue ? 'overdue' : 'due_soon';
            }
            
            await db.customers.update(customer.id!, {
                outstandingBalance: newBalance,
                totalSpent: customer.totalSpent + finalSaleData.total,
                lastActivityDate: now,
                isOverLimit,
                debtStatus,
            });
        }
        
        return { saleId, invoiceNumber };
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
