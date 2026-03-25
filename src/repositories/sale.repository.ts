// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Sale } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class SaleRepository {

    async findByUuid(uuid: string): Promise<Sale | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async findUnpaidByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async filter(filters: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async add(sale: Sale): Promise<Sale> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async delete(uuid: string): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async count(): Promise<number> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const saleRepository = new SaleRepository();
