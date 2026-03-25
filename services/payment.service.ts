'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment } from '@/lib/types';
import { paymentRepository, customerRepository } from '@/repositories';

class PaymentService {
    
    async addPayment(paymentData: { customerUuid: string, amount: number, paymentDate: Date, notes?: string }): Promise<Payment> {
        const { customerUuid, amount, paymentDate, notes } = paymentData;

        const customer = await customerRepository.findByUuid(customerUuid);
        if (!customer) {
            throw new Error("Client non trouvé.");
        }

        const newPayment: Payment = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            customerUuid,
            customerName: `${customer.firstName} ${customer.lastName}`,
            amount,
            paymentDate,
            notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return await paymentRepository.add(newPayment);
    }
}

export const paymentService = new PaymentService();
