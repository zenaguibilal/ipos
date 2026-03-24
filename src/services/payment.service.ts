'use client';

import { db } from '@/lib/database';
import type { Payment, Sale, Customer } from '@/lib/types';

export class PaymentService {
    async addPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
        return db.transaction('rw', db.payments, db.customers, db.sales, async () => {
            const now = new Date();
            const newPayment = { ...paymentData, createdAt: now, updatedAt: now };
            const id = await db.payments.add(newPayment as Payment);

            const customer = await db.customers.get(paymentData.customerId);
            if (customer) {

                // Allocate payment to oldest unpaid sales
                let amountToAllocate = paymentData.amount;
                if (amountToAllocate > 0) {
                    const unpaidSales = await db.sales
                        .where('customerId').equals(paymentData.customerId)
                        .and(sale => sale.paymentStatus !== 'paid')
                        .sortBy('createdAt');

                    for (const sale of unpaidSales) {
                        if (amountToAllocate <= 0) break;

                        const payableAmount = Math.min(amountToAllocate, sale.remainingBalance);
                        
                        if (payableAmount > 0) {
                            const newAmountPaid = sale.amountPaid + payableAmount;
                            const newRemainingBalance = sale.remainingBalance - payableAmount;
                            const newPaymentStatus: Sale['paymentStatus'] = newRemainingBalance <= 0.01 ? 'paid' : 'partial';

                            await db.sales.update(sale.id!, {
                                amountPaid: newAmountPaid,
                                remainingBalance: newRemainingBalance,
                                paymentStatus: newPaymentStatus,
                            });

                            amountToAllocate -= payableAmount;
                        }
                    }
                }

                const newBalance = customer.outstandingBalance - paymentData.amount;
                const isOverLimit = customer.creditLimit != null ? newBalance > customer.creditLimit : false;
                
                let debtStatus: Customer['debtStatus'] = 'none';
                if (newBalance > 0) {
                    const remainingUnpaidSales = await db.sales.where('customerId').equals(customer.id!).and(s => s.paymentStatus !== 'paid').toArray();
                    const isOverdue = remainingUnpaidSales.some(s => s.dueDate && new Date(s.dueDate) < new Date());
                    debtStatus = isOverdue ? 'overdue' : 'due_soon';
                }

                await db.customers.update(customer.id!, {
                    outstandingBalance: newBalance,
                    lastActivityDate: now,
                    isOverLimit,
                    debtStatus,
                });
            }

            return { ...newPayment, id };
        });
    }
}
