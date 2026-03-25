'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Payment, Customer } from '@/lib/types';
import { paymentRepository } from '@/repositories/payment.repository';
import { customerRepository } from '@/repositories/customer.repository';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

class PaymentService {
    
    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async addPayment(paymentData: { customerUuid: string, amount: number, paymentDate: Date, notes?: string }): Promise<void> {
        const { customerUuid, amount, paymentDate, notes } = paymentData;

        try {
            const customer = await customerRepository.findByUuid(customerUuid);
            if (!customer) {
                throw new Error("Client non trouvé.");
            }

            const newPayment: Payment = {
                uuid: uuidv4(),
                user_id: this.getUserId(),
                customerUuid,
                amount,
                paymentDate,
                notes,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            await paymentRepository.add(newPayment);

            // After adding the payment, recalculate the customer's status
            await customerService.recalculateCustomerStatus(customerUuid);
        } catch (error: any) {
            console.error("Error adding payment:", error);
            throw new Error(error.message || "Une erreur est survenue lors de l'ajout du paiement.");
        }
    }

    async getPaymentsByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        return paymentRepository.findByCustomerUuid(customerUuid);
    }
}

export const paymentService = new PaymentService();
