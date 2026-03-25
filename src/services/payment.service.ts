'use client';

import { db } from '@/lib/database';
import type { Payment, Sale, Customer } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from '@/services/sync.service';
import { recalculateCustomerStatus } from '@/lib/customer-recalcs';

export class PaymentService {
    async addPayment(paymentData: Omit<Payment, 'id' | 'uuid'>): Promise<Payment> {
        return db.transaction('rw', db.payments, db.customers, db.sales, db.sync_queue, db.returns, async () => {
            const now = new Date();
            const uuid = uuidv4();
            const newPayment = { 
                ...paymentData, 
                uuid,
                createdAt: now, 
                updatedAt: now,
                sync_status: 'pending_create' as const,
                last_modified_by: syncService.getLocalDeviceId()
            };
            const id = await db.payments.add(newPayment as Payment);
            await syncService.queueSyncOperation('payments', uuid, 'create', { ...newPayment, id: undefined });


            const customer = await db.customers.where({ uuid: paymentData.customerUuid }).first();
            if (customer && customer.uuid) {
                // The customer's balance and status will be fully recalculated.
                // No need to manually allocate payments to sales here.
                await recalculateCustomerStatus(customer.uuid);
            }

            return { ...newPayment, id };
        });
    }
}
