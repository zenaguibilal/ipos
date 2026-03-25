// This is a placeholder for the Supabase repository.
// It's designed to throw errors if used before being implemented.
import type { Product } from '@/lib/types';

const NOT_IMPLEMENTED = "Repository not implemented. Backend connection is required.";

class ProductRepository {
    async getAll(options?: { sortBy?: string }): Promise<Product[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByUuid(uuid: string): Promise<Product | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async findByBarcode(barcode: string): Promise<Product | undefined> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async filter(filters: any): Promise<Product[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async getUniqueCategories(): Promise<string[]> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async add(product: Product): Promise<Product> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async update(uuid: string, data: Partial<Product>): Promise<Product> {
        throw new Error(NOT_IMPLEMENTED);
    }
    
    async delete(uuid: string): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async bulkGetByUuid(uuids: string[]): Promise<(Product | undefined)[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    async count(): Promise<number> {
        throw new Error(NOT_IMPLEMENTED);
    }
}

export const productRepository = new ProductRepository();
