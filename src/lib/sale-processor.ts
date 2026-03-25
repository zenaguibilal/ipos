'use client';

import { db } from '@/lib/database';
import type { Product, Sale, Customer, SaleItem } from '@/lib/types';
import { startOfDay, endOfDay, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '@/services/sync.service';

/**
 * This function processes a sale transaction. It must be called from within a Dexie transaction.
 * It handles stock checking, stock reduction, invoice number generation, and sale record creation.
 * Crucially, it DOES NOT handle customer balance updates, which are orchestrated by the calling service.
 * @param saleData - The data for the sale to be processed.
 * @returns An object containing the new saleId and invoiceNumber.
 */
export async function processSaleTransaction(saleData: any): Promise<{ saleId: number, invoiceNumber: string }> {
    const now = new Date();
    
    // 1. Check stock for real products
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

    // 2. Generate Invoice Number
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
    
    // 3. Determine Payment Status and Due Date
    const remainingBalance = saleData.total - saleData.amountPaid;
    let paymentStatus: Sale['paymentStatus'];
    if (Math.abs(remainingBalance) < 0.01) {
        paymentStatus = 'paid';
    } else if (saleData.amountPaid > 0) {
        paymentStatus = 'partial';
    } else {
        paymentStatus = 'unpaid';
    }

    let customer;
    if (saleData.customerUuid) {
        customer = await db.customers.where({ uuid: saleData.customerUuid }).first();
    }
    const dueDate = customer?.settlementDay ? new Date(now.getTime() + customer.settlementDay * 86400000) : saleData.dueDate;

    // 4. Create Sale Record
    const uuid = uuidv4();
    const finalSaleData: Sale = {
        ...saleData,
        uuid,
        invoiceNumber,
        createdAt: now,
        updatedAt: now,
        paymentStatus,
        remainingBalance,
        dueDate,
        sync_status: 'pending_create' as const,
        last_modified_by: syncService.getLocalDeviceId(),
    };

    const saleId = await db.sales.add(finalSaleData);
    await syncService.queueSyncOperation('sales', uuid, 'create', { ...finalSaleData, id: undefined });


    // 5. Update Product Stock
    for (const item of finalSaleData.items) {
        if (typeof item.id === 'number') {
            await db.products.where('id').equals(item.id).modify(p => { p.quantity -= item.quantity; });
            const product = await db.products.get(item.id);
            if (product && product.uuid) {
                 await syncService.queueSyncOperation('products', product.uuid, 'update', { quantity: product.quantity, updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            }
        }
    }
    
    // Customer balance update is now handled by the calling service to ensure atomicity with other operations.
    
    return { saleId, invoiceNumber };
}
