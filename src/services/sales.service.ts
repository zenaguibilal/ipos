'use client';

import { db } from '@/lib/database';
import type { Sale, Customer } from '@/lib/types';
import { toast } from 'sonner';
import { processSaleTransaction } from '@/lib/sale-processor';
import { syncService } from './sync.service';

export class SalesService {
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        const sale = await db.sales.where('invoiceNumber').equals(invoiceNumber).first();
        if (sale?.sync_status === 'pending_delete') return undefined;
        return sale;
    }
    
    async getSales(params: { query?: string, from?: Date, to?: Date } = {}): Promise<Sale[]> {
        let collection = db.sales.where('sync_status').notEqual('pending_delete');
        
        if (params.from && params.to) {
             collection = db.sales.where('createdAt').between(params.from, params.to, true, true)
                .and(s => s.sync_status !== 'pending_delete');
        }

        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(s => s.invoiceNumber.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q));
        }
        return await collection.reverse().sortBy('createdAt');
    }

    async addSale(saleData: any): Promise<number> {
        return db.transaction('rw', db.sales, db.products, db.customers, db.sync_queue, async () => {
            const { saleId, invoiceNumber } = await processSaleTransaction(saleData);
            toast.success(`Vente #${invoiceNumber} finalisée.`);
            return saleId;
        });
    }
    
    async deleteSale(saleId: number): Promise<void> {
        await db.transaction('rw', db.sales, db.products, db.customers, db.sync_queue, async () => {
            const sale = await db.sales.get(saleId);
            if (!sale || !sale.uuid) return;
    
            // Restore product stock
            for (const item of sale.items) {
                if (typeof item.id === 'number') {
                    const product = await db.products.get(item.id);
                    if (product && product.uuid) {
                        const newQuantity = product.quantity + item.quantity;
                        await db.products.update(item.id, { quantity: newQuantity });
                        await syncService.queueSyncOperation('products', product.uuid, 'update', { quantity: newQuantity, updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
                    }
                }
            }
    
            // Adjust customer balance
            if (sale.customerUuid) {
                const customer = await db.customers.where({ uuid: sale.customerUuid }).first();
                if (customer && customer.uuid) {
                    const newBalance = customer.outstandingBalance - sale.remainingBalance;
                    const newTotalSpent = customer.totalSpent - sale.total;
                    const isOverLimit = customer.creditLimit != null && newBalance > customer.creditLimit;
                    
                    let debtStatus: Customer['debtStatus'] = 'none';
                    if (newBalance > 0) {
                        const unpaidSales = await db.sales.where('customerUuid').equals(customer.uuid).and(s => s.id !== saleId && s.sync_status !== 'pending_delete').toArray();
                        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                        debtStatus = isOverdue ? 'overdue' : 'due_soon';
                    }
    
                    const customerUpdate = {
                        outstandingBalance: newBalance,
                        totalSpent: newTotalSpent,
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
    
            // Soft delete the sale
            await db.sales.update(saleId, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('sales', sale.uuid, 'delete', {});
        });
    }
}
