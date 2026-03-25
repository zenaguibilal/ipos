'use client';

import type { Customer } from '@/lib/types';
import { syncService } from '@/services/sync.service';
import { customerRepository, paymentRepository, returnRepository, saleRepository } from '@/repositories';

/**
 * Recalculates a customer's financial status from scratch based on their entire transaction history.
 * This is the single source of truth for customer balance, debt status, and total spent.
 * This function should be called from within a Dexie transaction.
 * @param customerUuid The UUID of the customer to recalculate.
 */
export async function recalculateCustomerStatus(customerUuid: string): Promise<void> {
    const customer = await customerRepository.findByUuid(customerUuid);
    if (!customer) return;

    const now = new Date();

    const sales = await saleRepository.findByCustomerUuid(customerUuid);
    const payments = await paymentRepository.findByCustomerUuid(customerUuid);
    const returns = await returnRepository.findByCustomerUuid(customerUuid);

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
    };
    
    if (customer.sync_status !== 'pending_create') {
        customerUpdate.sync_status = 'pending_update';
        customerUpdate.last_modified_by = syncService.getLocalDeviceId();
        // We only need to queue the final state for sync
        await syncService.queueSyncOperation('customers', customer.uuid, 'update', { 
            totalSpent: customerUpdate.totalSpent,
            outstandingBalance: customerUpdate.outstandingBalance,
            lastActivityDate: customerUpdate.lastActivityDate,
            isOverLimit: customerUpdate.isOverLimit,
            debtStatus: customerUpdate.debtStatus,
            updatedAt: customerUpdate.updatedAt,
            last_modified_by: customerUpdate.last_modified_by
        });
    }
    
    await customerRepository.update(customer.id!, customerUpdate);
}
