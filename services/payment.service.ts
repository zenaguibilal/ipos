'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment } from '@/lib/types';
import { paymentRepository } from '@/repositories/payment.repository';
import { customerRepository } from '@/repositories/customer.repository';

class PaymentService {
    
    async addPayment(paymentData: { customerUuid: string, amount: number, paymentDate: Date, notes?: string }): Promise<Payment> {
        const { customerUuid, amount, paymentDate, notes } = paymentData;

        // Validation is good, but fetching the full customer object just to get the name
        // is denormalization. The component layer can join this data for display.
        const customer = await customerRepository.findByUuid(customerUuid);
        if (!customer) {
            throw new Error("Client non trouvé.");
        }

        const newPayment: Payment = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            customerUuid,
            amount,
            paymentDate,
            notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return await paymentRepository.add(newPayment);
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        return paymentRepository.findByCustomerUuid(customerUuid);
    }
}

export const paymentService = new PaymentService();
