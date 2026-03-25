'use client';

import { db } from '@/lib/database';
import type { Product, ProductReturn, Customer, Sale } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class ReturnService {
    async getReturns(params: { query?: string, from?: Date, to?: Date }): Promise<ProductReturn[]> {
        let collection = db.returns.where('sync_status').notEqual('pending_delete').reverse();

        if (params.from && params.to) {
             collection = collection.filter(s => s.createdAt! >= params.from! && s.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.originalInvoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.sortBy('createdAt');
    }
    
    async addReturn(returnData: Omit<ProductReturn, 'id'>): Promise<ProductReturn> {
        return db.transaction('rw', db.returns, db.products, db.customers, db.sales, db.sync_queue, async () => {
            const now = new Date();
            const uuid = uuidv4();
            const newReturn: ProductReturn = {
                ...returnData,
                uuid,
                createdAt: now,
                updatedAt: now,
                sync_status: 'pending_create',
                last_modified_by: syncService.getLocalDeviceId(),
            };
            const id = await db.returns.add(newReturn);
            await syncService.queueSyncOperation('returns', uuid, 'create', { ...newReturn, id: undefined });


            for (const item of newReturn.items) {
                if (item.wasRestocked && item.productId) {
                    await db.products.where('id').equals(item.productId).modify(p => { p.quantity += item.quantity; });
                    const product = await db.products.get(item.productId);
                    if(product && product.uuid) {
                        await syncService.queueSyncOperation('products', product.uuid, 'update', { quantity: product.quantity, updatedAt: now, last_modified_by: syncService.getLocalDeviceId() });
                    }
                }
            }

            if (newReturn.customerUuid) {
                const customer = await db.customers.where({ uuid: newReturn.customerUuid }).first();
                if (customer && customer.uuid) {
                    const balanceChange = newReturn.amountRefunded - newReturn.totalReturnValue;
                    const newBalance = customer.outstandingBalance + balanceChange;
                    const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;

                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerUuid').equals(customer.uuid).and(s => s.paymentStatus !== 'paid' && s.sync_status !== 'pending_delete').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }

                    const customerUpdate = {
                        outstandingBalance: newBalance,
                        lastActivityDate: now,
                        isOverLimit,
                        debtStatus,
                        updatedAt: now,
                        sync_status: 'pending_update' as const,
                        last_modified_by: syncService.getLocalDeviceId(),
                    };

                    await db.customers.update(customer.id!, customerUpdate);
                    await syncService.queueSyncOperation('customers', customer.uuid, 'update', customerUpdate);
                }
            }

            return { ...newReturn, id };
        });
    }

    async deleteReturn(returnId: number): Promise<void> {
        await db.transaction('rw', db.returns, db.products, db.customers, db.sales, db.sync_queue, async () => {
            const pr = await db.returns.get(returnId);
            if (!pr || !pr.uuid) return;
    
            const stockUpdates = new Map<number, number>();
            for (const item of pr.items) {
                if (item.wasRestocked && item.productId) {
                    stockUpdates.set(item.productId, (stockUpdates.get(item.productId) || 0) + item.quantity);
                }
            }
    
            if (stockUpdates.size > 0) {
                const productIds = Array.from(stockUpdates.keys());
                const productsToUpdate = await db.products.bulkGet(productIds);
    
                for(const product of productsToUpdate) {
                    if (product && product.id && product.uuid) {
                        const quantityToSubtract = stockUpdates.get(product.id);
                        if (quantityToSubtract) {
                           const newQuantity = product.quantity - quantityToSubtract;
                           await db.products.update(product.id, { quantity: newQuantity });
                           await syncService.queueSyncOperation('products', product.uuid, 'update', { quantity: newQuantity, updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
                        }
                    }
                }
            }
    
            if (pr.customerUuid) {
                const customer = await db.customers.where({ uuid: pr.customerUuid }).first();
                if (customer && customer.uuid) {
                    const balanceChange = pr.amountRefunded - pr.totalReturnValue;
                    const newBalance = customer.outstandingBalance - balanceChange;
                    const isOverLimit = customer.creditLimit != null && newBalance > customer.creditLimit;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerUuid').equals(customer.uuid).and(s => s.paymentStatus !== 'paid' && s.sync_status !== 'pending_delete').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }
    
                     const customerUpdate = {
                        outstandingBalance: newBalance,
                        isOverLimit,
                        debtStatus,
                        updatedAt: new Date(),
                        sync_status: 'pending_update' as const,
                        last_modified_by: syncService.getLocalDeviceId()
                    };
                    await db.customers.update(customer.id!, customerUpdate);
                    await syncService.queueSyncOperation('customers', customer.uuid, 'update', customerUpdate);
                }
            }
    
            await db.returns.update(returnId, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('returns', pr.uuid, 'delete', {});
        });
    }
}
