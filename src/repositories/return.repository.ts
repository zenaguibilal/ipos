// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { ProductReturn } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class ReturnRepository {

    async findByUuid(uuid: string): Promise<ProductReturn | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async findByCustomerUuid(customerUuid: string): Promise<ProductReturn[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async filter(filters: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async add(productReturn: ProductReturn): Promise<ProductReturn> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async delete(uuid: string): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const returnRepository = new ReturnRepository();
