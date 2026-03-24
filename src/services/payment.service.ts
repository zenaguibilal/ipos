'use client';

import { db } from '@/lib/database';
import type { Payment, Sale, Customer } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class PaymentService {
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        return db.transaction('rw', db.payments, db.customers, db.sales, db.sync_queue, async () => {
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


            const customer = await db.customers.get(paymentData.customerId);
            if (customer && customer.uuid) {

                // Allocate payment to oldest unpaid sales
                let amountToAllocate = paymentData.amount;
                if (amountToAllocate > 0) {
                    const unpaidSales = await db.sales
                        .where('customerId').equals(paymentData.customerId)
                        .and(sale => sale.paymentStatus !== 'paid' && sale.sync_status !== 'pending_delete')
                        .sortBy('createdAt');

                    for (const sale of unpaidSales) {
                        if (amountToAllocate <= 0) break;

                        const payableAmount = Math.min(amountToAllocate, sale.remainingBalance);
                        
                        if (payableAmount > 0 && sale.uuid) {
                            const newAmountPaid = sale.amountPaid + payableAmount;
                            const newRemainingBalance = sale.remainingBalance - payableAmount;
                            const newPaymentStatus: Sale['paymentStatus'] = newRemainingBalance <= 0.01 ? 'paid' : 'partial';

                            const saleUpdate = {
                                amountPaid: newAmountPaid,
                                remainingBalance: newRemainingBalance,
                                paymentStatus: newPaymentStatus,
                                updatedAt: now,
                                sync_status: 'pending_update' as const,
                                last_modified_by: syncService.getLocalDeviceId()
                            };

                            await db.sales.update(sale.id!, saleUpdate);
                            await syncService.queueSyncOperation('sales', sale.uuid, 'update', saleUpdate);

                            amountToAllocate -= payableAmount;
                        }
                    }
                }

                const newBalance = customer.outstandingBalance - paymentData.amount;
                const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
                
                let debtStatus: Customer['debtStatus'] = 'none';
                if (newBalance > 0) {
                    const remainingUnpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid' && s.sync_status !== 'pending_delete').toArray();
                    const isOverdue = remainingUnpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                    debtStatus = isOverdue ? 'overdue' : 'due_soon';
                }

                const customerUpdate = {
                    outstandingBalance: newBalance,
                    lastActivityDate: now,
                    isOverLimit,
                    debtStatus,
                    updatedAt: now,
                    sync_status: 'pending_update' as const,
                    last_modified_by: syncService.getLocalDeviceId()
                };

                await db.customers.update(customer.id!, customerUpdate);
                await syncService.queueSyncOperation('customers', customer.uuid, 'update', customerUpdate);
            }

            return { ...newPayment, id };
        });
    }
}
