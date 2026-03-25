'use client';

import { db } from '@/lib/database';
import type { Customer } from '@/lib/types';
import { syncService } from '@/services/sync.service';

/**
 * Recalculates a customer's financial status from scratch based on their entire transaction history.
 * This is the single source of truth for customer balance, debt status, and total spent.
 * This function should be called from within a Dexie transaction.
 * @param customerUuid The UUID of the customer to recalculate.
 */
export async function recalculateCustomerStatus(customerUuid: string): Promise<void> {
    const customer = await db.customers.where({ uuid: customerUuid }).first();
    if (!customer) return;

    const now = new Date();

    const sales = await db.sales.where({ customerUuid }).and(s => s.sync_status !== 'pending_delete').toArray();
    const payments = await db.payments.where({ customerUuid }).and(p => p.sync_status !== 'pending_delete').toArray();
    const returns = await db.returns.where({ customerUuid }).and(r => r.sync_status !== 'pending_delete').toArray();

    const totalInvoiced = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPaidViaPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const netCreditFromReturns = returns.reduce((sum, r) => sum + (r.totalReturnValue - r.amountRefunded), 0);

    const newBalance = totalInvoiced - totalPaidViaPayments - netCreditFromReturns;
    const totalSpent = totalInvoiced;

    const isOverLimit = customer.creditLimit != null && customer.creditLimit > 0 ? newBalance > customer.creditLimit : false;

    let debtStatus: Customer['debtStatus'] = 'none';
    if (newBalance > 0.01) { // Use a small epsilon for float comparison
        const unpaidSales = sales.filter(s => s.paymentStatus !== 'paid');
        const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
        debtStatus = isOverdue ? 'overdue' : 'due_soon';
    }

    const customerUpdate: Partial<Customer> = {
        totalSpent,
        outstandingBalance: newBalance,
        lastActivityDate: now,
        isOverLimit,
        debtStatus,
        updatedAt: now,
        sync_status: customer.sync_status === 'pending_create' ? 'pending_create' : 'pending_update',
        last_modified_by: syncService.getLocalDeviceId(),
    };
    
    await db.customers.update(customer.id!, customerUpdate);
    
    if (customer.sync_status !== 'pending_create') {
        // We only need to queue the final state for sync
        const { id, ...payloadForSync } = customerUpdate;
        await syncService.queueSyncOperation('customers', customer.uuid, 'update', payloadForSync);
    }
}
