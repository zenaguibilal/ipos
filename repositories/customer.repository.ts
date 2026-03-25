// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Customer } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class CustomerRepository {
    async getAll(): Promise<Customer[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async findByUuid(uuid: string): Promise<Customer | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByName(searchName: string): Promise<Customer | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async filter(filters: { query?: string, status?: string }): Promise<Customer[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async add(customer: Customer): Promise<Customer> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async update(uuid: string, data: Partial<Customer>): Promise<Customer> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async delete(uuid: string): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async count(): Promise<number> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const customerRepository = new CustomerRepository();
