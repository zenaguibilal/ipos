'use client';

import { db } from '@/lib/database';
import type { Sale, Customer } from '@/lib/types';
import { toast } from 'sonner';
import { processSaleTransaction } from '@/lib/sale-processor';
import { syncService } from '@/services/sync.service';
import { recalculateCustomerStatus } from '@/lib/customer-recalcs';

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
        const customerUuid = saleData.customerUuid;
        return db.transaction('rw', db.sales, db.products, db.customers, db.sync_queue, db.returns, db.payments, async () => {
            const { saleId, invoiceNumber } = await processSaleTransaction(saleData);

            if (customerUuid) {
                await recalculateCustomerStatus(customerUuid);
            }

            toast.success(`Vente #${invoiceNumber} finalisée.`);
            return saleId;
        });
    }
    
    async deleteSale(saleId: number): Promise<void> {
        await db.transaction('rw', db.sales, db.products, db.customers, db.sync_queue, db.returns, db.payments, async () => {
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
    
            const customerUuid = sale.customerUuid;
    
            // Soft delete the sale
            await db.sales.update(saleId, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('sales', sale.uuid, 'delete', {});

            // Adjust customer balance
            if (customerUuid) {
                await recalculateCustomerStatus(customerUuid);
            }
        });
    }
}
