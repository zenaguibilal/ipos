'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier } from '@/lib/types';
import { supplierRepository } from '@/repositories/supplier.repository';

class SupplierService {
    async getSuppliers(): Promise<Supplier[]> {
        return supplierRepository.getAll();
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return supplierRepository.findByUuid(uuid);
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        if (uuid) {
            const existing = await supplierRepository.findByUuid(uuid);
            if (existing) return existing;
        }

        const existingByName = await supplierRepository.findByName(name);
        if (existingByName) return existingByName;

        const newSupplier: Supplier = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder',
            name: name,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return supplierRepository.add(newSupplier);
    }
}

export const supplierService = new SupplierService();
