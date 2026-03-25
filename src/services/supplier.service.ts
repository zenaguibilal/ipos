'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier } from '@/lib/types';
import { supplierRepository } from '@/repositories/supplier.repository';
import { useAppStore } from '@/stores/appStore';

class SupplierService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

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
            user_id: this.getUserId(),
            name: name,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return supplierRepository.add(newSupplier);
    }
}

export const supplierService = new SupplierService();
