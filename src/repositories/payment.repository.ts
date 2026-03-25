// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Payment } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class PaymentRepository {
    async findByCustomerUuid(customerUuid: string): Promise<Payment[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async add(payment: Payment): Promise<Payment> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const paymentRepository = new PaymentRepository();
