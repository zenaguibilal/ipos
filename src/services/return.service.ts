'use client';

import { db } from '@/lib/database';
import type { Product, ProductReturn, Customer, Sale } from '@/lib/types';

export class ReturnService {
    async getReturns(params: { query?: string, from?: Date, to?: Date }): Promise<ProductReturn[]> {
        let collection = db.returns.orderBy('createdAt').reverse();
        if (params.from && params.to) {
             collection = collection.filter(s => s.createdAt! >= params.from! && s.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.originalInvoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }
    
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        return db.transaction('rw', db.returns, db.products, db.customers, db.sales, async () => {
            const now = new Date();
            const newReturn: ProductReturn = {
                ...returnData,
                createdAt: now,
                updatedAt: now,
            };

            for (const item of newReturn.items) {
                if (item.wasRestocked && item.productId) {
                    await db.products.where('id').equals(item.productId).modify(p => { p.quantity += item.quantity; });
                }
            }

            if (newReturn.customerId) {
                const customer = await db.customers.get(newReturn.customerId);
                if (customer) {
                    const balanceChange = newReturn.amountRefunded - newReturn.totalReturnValue;
                    const newBalance = customer.outstandingBalance + balanceChange;
                    const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;

                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }

                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        lastActivityDate: now,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }

            const id = await db.returns.add(newReturn);
            return { ...newReturn, id };
        });
    }

    async deleteReturn(returnId: number): Promise<void> {
        await db.transaction('rw', db.returns, db.products, db.customers, db.sales, async () => {
            const pr = await db.returns.get(returnId);
            if (!pr) return;
    
            const stockUpdates = new Map<number, number>();
            for (const item of pr.items) {
                if (item.wasRestocked && item.productId) {
                    stockUpdates.set(item.productId, (stockUpdates.get(item.productId) || 0) + item.quantity);
                }
            }
    
            if (stockUpdates.size > 0) {
                const productIds = Array.from(stockUpdates.keys());
                const productsToUpdate = await db.products.bulkGet(productIds);
                const updatePayload: { key: number, changes: Partial<Product> }[] = [];
    
                productsToUpdate.forEach(product => {
                    if (product && product.id) {
                        const quantityToSubtract = stockUpdates.get(product.id);
                        if (quantityToSubtract) {
                            updatePayload.push({
                                key: product.id,
                                changes: { quantity: product.quantity - quantityToSubtract }
                            });
                        }
                    }
                });
                if (updatePayload.length > 0) {
                    await db.products.bulkUpdate(updatePayload);
                }
            }
    
            if (pr.customerId) {
                const customer = await db.customers.get(pr.customerId);
                if (customer) {
                    const balanceChange = pr.amountRefunded - pr.totalReturnValue;
                    const newBalance = customer.outstandingBalance - balanceChange;
                    const isOverLimit = customer.creditLimit != null && newBalance > customer.creditLimit;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }
    
                    await db.customers.update(customer.id!, {
                        outstandingBalance: newBalance,
                        isOverLimit,
                        debtStatus,
                    });
                }
            }
    
            await db.returns.delete(returnId);
        });
    }
}
