'use client';
/**
 * @fileOverview Payment Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Payment } from '@/lib/types';

class PaymentService {
    async addPayment(paymentData: any): Promise<void> {
        return api.post('payments', paymentData);
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        return api.get<Payment[]>(`customers/${customerUuid}/payments`);
    }
}

export const paymentService = new PaymentService();
