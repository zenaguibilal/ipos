'use client';

import type { Supplier } from '@/lib/types';
import { supplierRepository } from '@/repositories';

class SupplierService {
    async getSuppliers(): Promise<Supplier[]> {
        return supplierRepository.getAll();
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return supplierRepository.findByUuid(uuid);
    }
}

export const supplierService = new SupplierService();
