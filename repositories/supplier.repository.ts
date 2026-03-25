// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Supplier } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class SupplierRepository {
    async getAll(): Promise<Supplier[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByUuid(uuid: string): Promise<Supplier | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByName(name: string): Promise<Supplier | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async add(supplier: Supplier): Promise<Supplier> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const supplierRepository = new SupplierRepository();
